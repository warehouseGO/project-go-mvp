const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.upsertTBT = async (req, res) => {
  try {
    const { siteId } = req.params;
    const {
      date,
      specificPPE,
      housekeeping,
      plantEquipmentSafety,
      workingUnderSuspendedLoad,
      importantOfEyeShower,
    } = req.body;

    if (!date) return res.status(400).json({ error: "date is required" });

    const parsedDate = new Date(date);
    const tbt = await prisma.tBTTopic.upsert({
      where: {
        siteId_date: { siteId: parseInt(siteId), date: parsedDate },
      },
      create: {
        siteId: parseInt(siteId),
        date: parsedDate,
        specificPPE,
        housekeeping,
        plantEquipmentSafety,
        workingUnderSuspendedLoad,
        importantOfEyeShower,
      },
      update: {
        specificPPE,
        housekeeping,
        plantEquipmentSafety,
        workingUnderSuspendedLoad,
        importantOfEyeShower,
      },
    });

    res.json(tbt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upsert TBT data" });
  }
};

exports.getTBTByDate = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date is required" });
    const tbt = await prisma.tBTTopic.findUnique({
      where: {
        siteId_date: { siteId: parseInt(siteId), date: new Date(date) },
      },
    });
    res.json(tbt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch TBT data" });
  }
};
