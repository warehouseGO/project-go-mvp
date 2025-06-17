const { PrismaClient, JobStatus } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getJobs = async (req, res) => {
  try {
    const { role, userId } = req.query;
    let where = {};
    if (role === "CLUSTER_SUPERVISOR") {
      where = { device: { assignedTo: parseInt(userId) } };
    }
    const jobs = await prisma.job.findMany({
      where,
      include: { device: true },
    });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

exports.createJobs = async (req, res) => {
  try {
    const { deviceId, jobs } = req.body;
    const { userId } = req.user; // Assume JWT payload includes userId
    const createdJobs = await Promise.all(
      jobs.map((job) =>
        prisma.job.create({
          data: {
            name: job.name,
            deviceId: parseInt(deviceId),
            status: JobStatus.IN_PROGRESS,
          },
        })
      )
    );
    res.status(201).json(createdJobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create jobs" });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    if (!Object.values(JobStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (status === JobStatus.CONSTRAINT && !comment) {
      return res
        .status(400)
        .json({ error: "Comment required for constraint status" });
    }
    const { userId } = req.user; // Assume JWT payload includes userId
    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { status, comment, updatedBy: userId },
    });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update job status" });
  }
};
