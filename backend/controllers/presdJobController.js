const { PrismaClient } = require("@prisma/client");
const { JobStatus, DevicePriority } = require("@prisma/client");

const prisma = new PrismaClient();

// Get all PreSD jobs for a site with efficient queries
exports.getPreSDJobs = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId, role } = req.user;
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      priority = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Cap at 100
    const skip = (pageNum - 1) * limitNum;

    // Verify user has access to this site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== parseInt(siteId)) {
        return res.status(403).json({ error: "Access denied to this site" });
      }
    }

    // Build where clause
    const where = { siteId: parseInt(siteId) };

    if (search) {
      where.jobDescription = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    // Get total count for pagination
    const totalCount = await prisma.preSDJob.count({ where });

    // Get jobs with pagination and efficient select
    const jobs = await prisma.preSDJob.findMany({
      where,
      select: {
        id: true,
        jobDescription: true,
        status: true,
        completedDate: true,
        priority: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limitNum,
    });

    res.json({
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch PreSD jobs" });
  }
};

// Get single PreSD job
exports.getPreSDJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, role } = req.user;

    const job = await prisma.preSDJob.findUnique({
      where: { id: parseInt(jobId) },
      select: {
        id: true,
        jobDescription: true,
        status: true,
        completedDate: true,
        priority: true,
        remarks: true,
        siteId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: "PreSD job not found" });
    }

    // Verify user has access to this job's site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== job.siteId) {
        return res.status(403).json({ error: "Access denied to this job" });
      }
    }

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch PreSD job" });
  }
};

// Create new PreSD job
exports.createPreSDJob = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId, role } = req.user;
    const { jobDescription, priority = "MEDIUM", remarks } = req.body;

    // Verify user has permission to create jobs for this site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== parseInt(siteId)) {
        return res
          .status(403)
          .json({ error: "Not authorized to create jobs for this site" });
      }
    }

    // Validate required fields
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: "Job description is required" });
    }

    // Validate priority
    if (!Object.values(DevicePriority).includes(priority)) {
      return res.status(400).json({ error: "Invalid priority value" });
    }

    const job = await prisma.preSDJob.create({
      data: {
        jobDescription: jobDescription.trim(),
        priority,
        remarks: remarks?.trim() || null,
        siteId: parseInt(siteId),
        createdBy: parseInt(userId),
      },
      select: {
        id: true,
        jobDescription: true,
        status: true,
        completedDate: true,
        priority: true,
        remarks: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create PreSD job" });
  }
};

// Update PreSD job
exports.updatePreSDJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, role } = req.user;
    const { jobDescription, status, completedDate, priority, remarks } =
      req.body;

    // Get existing job to verify access
    const existingJob = await prisma.preSDJob.findUnique({
      where: { id: parseInt(jobId) },
      select: { siteId: true, status: true },
    });

    if (!existingJob) {
      return res.status(404).json({ error: "PreSD job not found" });
    }

    // Verify user has access to this job's site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== existingJob.siteId) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this job" });
      }
    }

    // Validate status transition
    if (status && status !== existingJob.status) {
      if (status === "COMPLETED" && !completedDate) {
        return res.status(400).json({
          error: "Completed date is required when marking job as completed",
        });
      }
    }

    // Validate priority
    if (priority && !Object.values(DevicePriority).includes(priority)) {
      return res.status(400).json({ error: "Invalid priority value" });
    }

    // Validate status
    if (status && !Object.values(JobStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const updateData = {};
    if (jobDescription !== undefined)
      updateData.jobDescription = jobDescription.trim();
    if (status !== undefined) updateData.status = status;
    if (completedDate !== undefined) {
      updateData.completedDate = completedDate ? new Date(completedDate) : null;
    }
    if (priority !== undefined) updateData.priority = priority;
    if (remarks !== undefined) updateData.remarks = remarks?.trim() || null;
    updateData.updatedBy = parseInt(userId);

    const job = await prisma.preSDJob.update({
      where: { id: parseInt(jobId) },
      data: updateData,
      select: {
        id: true,
        jobDescription: true,
        status: true,
        completedDate: true,
        priority: true,
        remarks: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update PreSD job" });
  }
};

// Delete PreSD job
exports.deletePreSDJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, role } = req.user;

    // Get existing job to verify access
    const existingJob = await prisma.preSDJob.findUnique({
      where: { id: parseInt(jobId) },
      select: { siteId: true },
    });

    if (!existingJob) {
      return res.status(404).json({ error: "PreSD job not found" });
    }

    // Verify user has access to this job's site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== existingJob.siteId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this job" });
      }
    }

    await prisma.preSDJob.delete({
      where: { id: parseInt(jobId) },
    });

    res.json({ message: "PreSD job deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete PreSD job" });
  }
};

// Bulk create PreSD jobs from Excel import
exports.bulkCreatePreSDJobs = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { jobs } = req.body;
    const { userId, role } = req.user;

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ error: "Jobs array is required" });
    }

    // Verify user has permission to create jobs for this site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== parseInt(siteId)) {
        return res
          .status(403)
          .json({ error: "Not authorized to create jobs for this site" });
      }
    }

    // Validate jobs data
    const validationErrors = [];
    jobs.forEach((job, index) => {
      if (!job.jobDescription || !job.jobDescription.trim()) {
        validationErrors.push(`Job ${index + 1}: Job description is required`);
      }
      if (
        job.priority &&
        !Object.values(DevicePriority).includes(job.priority)
      ) {
        validationErrors.push(`Job ${index + 1}: Invalid priority value`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Optimized bulk creation
    const createdJobs = await prisma.$transaction(async (tx) => {
      // Prepare all job data for batch creation
      const jobDataArray = jobs.map((jobData) => ({
        jobDescription: jobData.jobDescription.trim(),
        priority: jobData.priority || "MEDIUM",
        remarks: jobData.remarks?.trim() || null,
        siteId: parseInt(siteId),
        createdBy: parseInt(userId),
      }));

      // Batch create all jobs
      await tx.preSDJob.createMany({
        data: jobDataArray,
        skipDuplicates: true,
      });

      // Get the created jobs with their IDs
      const jobsWithIds = await tx.preSDJob.findMany({
        where: {
          siteId: parseInt(siteId),
          createdBy: parseInt(userId),
        },
        select: { id: true, jobDescription: true },
        orderBy: { createdAt: "desc" },
        take: jobs.length,
      });

      return jobsWithIds;
    });

    res.json({
      message: `Successfully created ${createdJobs.length} PreSD jobs`,
      jobs: createdJobs,
      count: createdJobs.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create PreSD jobs" });
  }
};

// Get PreSD job statistics for a site
exports.getPreSDJobStats = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId, role } = req.user;

    // Verify user has access to this site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== parseInt(siteId)) {
        return res.status(403).json({ error: "Access denied to this site" });
      }
    }

    // Get statistics with efficient aggregation
    const stats = await prisma.preSDJob.groupBy({
      by: ["status"],
      where: { siteId: parseInt(siteId) },
      _count: { status: true },
    });

    const priorityStats = await prisma.preSDJob.groupBy({
      by: ["priority"],
      where: { siteId: parseInt(siteId) },
      _count: { priority: true },
    });

    const totalJobs = await prisma.preSDJob.count({
      where: { siteId: parseInt(siteId) },
    });

    const completedJobs = await prisma.preSDJob.count({
      where: {
        siteId: parseInt(siteId),
        status: "COMPLETED",
      },
    });

    const completionRate =
      totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    res.json({
      totalJobs,
      completedJobs,
      completionRate: Math.round(completionRate * 100) / 100,
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {}),
      priorityBreakdown: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count.priority;
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch PreSD job statistics" });
  }
};
