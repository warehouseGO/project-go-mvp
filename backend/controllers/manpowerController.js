const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Get comprehensive manpower data for a site (analytics + recent entries + designations)
exports.getManpowerData = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId, role } = req.user;
    const {
      startDate,
      endDate,
      designation,
      selectedDate,
      includeAnalytics = true,
    } = req.query;

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

    // Build base where clause
    const baseWhere = { siteId: parseInt(siteId) };

    // Build analytics where clause
    const analyticsWhere = { ...baseWhere };
    if (startDate && endDate) {
      analyticsWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      analyticsWhere.date = { gte: new Date(startDate) };
    } else if (endDate) {
      analyticsWhere.date = { lte: new Date(endDate) };
    }

    if (designation) {
      analyticsWhere.designation = designation;
    }

    // Build recent entries where clause
    const entriesWhere = { ...baseWhere };
    if (selectedDate) {
      entriesWhere.date = new Date(selectedDate);
    }

    // Single query to get all manpower data with relations
    const allManpowerData = await prisma.manpower.findMany({
      where: baseWhere,
      select: {
        id: true,
        designation: true,
        date: true,
        dayshift: true,
        nightshift: true,
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
      orderBy: [{ date: "desc" }, { designation: "asc" }],
    });

    // Get unique designations
    const designations = [
      ...new Set(allManpowerData.map((item) => item.designation)),
    ].sort();

    // Filter data for analytics and recent entries
    const analyticsData = allManpowerData
      .filter((item) => {
        if (analyticsWhere.date) {
          if (analyticsWhere.date.gte && analyticsWhere.date.lte) {
            return (
              item.date >= analyticsWhere.date.gte &&
              item.date <= analyticsWhere.date.lte
            );
          } else if (analyticsWhere.date.gte) {
            return item.date >= analyticsWhere.date.gte;
          } else if (analyticsWhere.date.lte) {
            return item.date <= analyticsWhere.date.lte;
          }
        }
        return true;
      })
      .filter((item) => !designation || item.designation === designation);

    const recentEntries = allManpowerData.filter((item) => {
      if (selectedDate) {
        return item.date.toISOString().split("T")[0] === selectedDate;
      }
      return true;
    });

    // Process analytics data efficiently
    let analytics = null;
    if (includeAnalytics === "true" || includeAnalytics === true) {
      // Group by date for daily trends
      const dailyGroups = {};
      analyticsData.forEach((item) => {
        const dateKey = item.date.toISOString().split("T")[0];
        if (!dailyGroups[dateKey]) {
          dailyGroups[dateKey] = { dayshift: 0, nightshift: 0 };
        }
        dailyGroups[dateKey].dayshift += item.dayshift;
        dailyGroups[dateKey].nightshift += item.nightshift;
      });

      // Format data for trend chart
      const dailyChartData = Object.entries(dailyGroups)
        .map(([date, data]) => ({
          date,
          total: data.dayshift + data.nightshift,
          dayshift: data.dayshift,
          nightshift: data.nightshift,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate summary metrics based on date range
      const totalManpower = analyticsData.reduce(
        (sum, item) => sum + item.dayshift + item.nightshift,
        0
      );
      const averageManpower =
        dailyChartData.length > 0
          ? Math.round(
              dailyChartData.reduce((sum, day) => sum + day.total, 0) /
                dailyChartData.length
            )
          : 0;

      // Get today's or last updated date total
      const today = new Date().toISOString().split("T")[0];
      const todayData = dailyChartData.find((day) => day.date === today);
      const lastUpdatedData = dailyChartData[dailyChartData.length - 1];
      const currentTotal = todayData
        ? todayData.total
        : lastUpdatedData
        ? lastUpdatedData.total
        : 0;

      analytics = {
        dailyData: dailyChartData,
        summary: {
          currentTotal, // Today's or last updated total
          averageManpower, // Average based on selected date range
        },
      };
    }

    // Process data for specific date (selectedDate)
    let dateSpecificData = null;
    if (selectedDate) {
      const selectedDateData = allManpowerData.filter(
        (item) => item.date.toISOString().split("T")[0] === selectedDate
      );

      // Group by designation for the selected date
      const designationGroups = {};
      selectedDateData.forEach((item) => {
        if (!designationGroups[item.designation]) {
          designationGroups[item.designation] = { dayshift: 0, nightshift: 0 };
        }
        designationGroups[item.designation].dayshift += item.dayshift;
        designationGroups[item.designation].nightshift += item.nightshift;
      });

      const designationChartData = Object.entries(designationGroups)
        .map(([designation, data]) => ({
          designation,
          total: data.dayshift + data.nightshift,
          dayshift: data.dayshift,
          nightshift: data.nightshift,
        }))
        .sort((a, b) => a.designation.localeCompare(b.designation));

      // Calculate shift comparison for selected date
      const shiftComparison = {
        dayshift: selectedDateData.reduce(
          (sum, item) => sum + item.dayshift,
          0
        ),
        nightshift: selectedDateData.reduce(
          (sum, item) => sum + item.nightshift,
          0
        ),
        total: selectedDateData.reduce(
          (sum, item) => sum + item.dayshift + item.nightshift,
          0
        ),
      };

      dateSpecificData = {
        designationData: designationChartData,
        shiftComparison,
        entries: selectedDateData,
      };
    }

    res.json({
      analytics,
      dateSpecificData,
      designations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch manpower data" });
  }
};

// Legacy function - now redirects to the main getManpowerData function
exports.getManpowerAnalytics = async (req, res) => {
  // Redirect to the main data endpoint with analytics included
  req.query.includeAnalytics = "true";
  return exports.getManpowerData(req, res);
};

// Create manpower entry
exports.createManpowerEntry = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId, role } = req.user;
    const { designation, date, dayshift, nightshift } = req.body;

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

    // Validate required fields
    if (!designation || !date) {
      return res
        .status(400)
        .json({ error: "Designation and date are required" });
    }

    // Check for duplicate entry
    const existingEntry = await prisma.manpower.findUnique({
      where: {
        siteId_designation_date: {
          siteId: parseInt(siteId),
          designation,
          date: new Date(date),
        },
      },
    });

    if (existingEntry) {
      return res.status(400).json({
        error: "Entry already exists for this designation on this date",
      });
    }

    const entry = await prisma.manpower.create({
      data: {
        siteId: parseInt(siteId),
        designation,
        date: new Date(date),
        dayshift: parseInt(dayshift) || 0,
        nightshift: parseInt(nightshift) || 0,
        createdBy: parseInt(userId),
      },
      select: {
        id: true,
        designation: true,
        date: true,
        dayshift: true,
        nightshift: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create manpower entry" });
  }
};

// Update manpower entry
exports.updateManpowerEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { userId, role } = req.user;
    const { designation, date, dayshift, nightshift } = req.body;

    // Get existing entry to verify access
    const existingEntry = await prisma.manpower.findUnique({
      where: { id: parseInt(entryId) },
      select: { siteId: true },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: "Manpower entry not found" });
    }

    // Verify user has access to this entry's site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== existingEntry.siteId) {
        return res.status(403).json({ error: "Access denied to this entry" });
      }
    }

    const updateData = {};
    if (designation !== undefined) updateData.designation = designation;
    if (date !== undefined) updateData.date = new Date(date);
    if (dayshift !== undefined) updateData.dayshift = parseInt(dayshift) || 0;
    if (nightshift !== undefined)
      updateData.nightshift = parseInt(nightshift) || 0;
    updateData.updatedBy = parseInt(userId);

    const entry = await prisma.manpower.update({
      where: { id: parseInt(entryId) },
      data: updateData,
      select: {
        id: true,
        designation: true,
        date: true,
        dayshift: true,
        nightshift: true,
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

    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update manpower entry" });
  }
};

// Delete manpower entry
exports.deleteManpowerEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { userId, role } = req.user;

    // Get existing entry to verify access
    const existingEntry = await prisma.manpower.findUnique({
      where: { id: parseInt(entryId) },
      select: { siteId: true },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: "Manpower entry not found" });
    }

    // Verify user has access to this entry's site
    if (role === "SITE_INCHARGE") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true },
      });
      if (user.siteId !== existingEntry.siteId) {
        return res.status(403).json({ error: "Access denied to this entry" });
      }
    }

    await prisma.manpower.delete({
      where: { id: parseInt(entryId) },
    });

    res.json({ message: "Manpower entry deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete manpower entry" });
  }
};

// Bulk update manpower for a specific date
exports.bulkUpdateManpower = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { userId, role } = req.user;
    const { date, entries } = req.body;

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

    if (!date || !entries || !Array.isArray(entries)) {
      return res
        .status(400)
        .json({ error: "Date and entries array are required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete existing entries for this date
      await tx.manpower.deleteMany({
        where: {
          siteId: parseInt(siteId),
          date: new Date(date),
        },
      });

      // Create new entries
      const newEntries = entries.map((entry) => ({
        siteId: parseInt(siteId),
        designation: entry.designation,
        date: new Date(date),
        dayshift: parseInt(entry.dayshift) || 0,
        nightshift: parseInt(entry.nightshift) || 0,
        createdBy: parseInt(userId),
      }));

      await tx.manpower.createMany({
        data: newEntries,
      });

      // Return the created entries
      return newEntries;
    });

    res.json({
      message: `Successfully updated ${result.length} manpower entries`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to bulk update manpower" });
  }
};
