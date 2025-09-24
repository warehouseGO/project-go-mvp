const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.upsertSafety = async (req, res) => {
  try {
    const { siteId } = req.params;
    const {
      date,
      nearmiss = 0,
      firstaid = 0,
      lti = 0,
      fireincidents = 0,
      auditsConducted = 0,
      incidentReport = 0,
    } = req.body;

    if (!date) return res.status(400).json({ error: "date is required" });

    const parsedDate = new Date(date);
    const safety = await prisma.safety.upsert({
      where: {
        siteId_date: { siteId: parseInt(siteId), date: parsedDate },
      },
      create: {
        siteId: parseInt(siteId),
        date: parsedDate,
        nearmiss,
        firstaid,
        lti,
        fireincidents,
        auditsConducted,
        incidentReport,
      },
      update: {
        nearmiss,
        firstaid,
        lti,
        fireincidents,
        auditsConducted,
        incidentReport,
      },
    });

    res.json(safety);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upsert safety data" });
  }
};

exports.getSafetyByDate = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date is required" });
    const safety = await prisma.safety.findUnique({
      where: {
        siteId_date: { siteId: parseInt(siteId), date: new Date(date) },
      },
    });
    res.json(safety);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch safety data" });
  }
};
