const {
  PrismaClient,
  Role,
  UserStatus,
  JobStatus,
  DevicePriority,
} = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Create Owner user
  const ownerUser = await prisma.user.upsert({
    where: { email: "sahil@warehouse.com" },
    update: {},
    create: {
      email: "sahil@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "System Owner",
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log("Created owner user:", ownerUser.email);

  // Create sample sites
  const site1 = await prisma.site.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "VMD",
      location: "vadodara",
      description: "VMD",
      createdById: ownerUser.id,
    },
  });

  const site2 = await prisma.site.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "HMD",
      location: "haryana",
      description: "HMD",
      createdById: ownerUser.id,
    },
  });
  const site3 = await prisma.site.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "HMEL Bhatinda",
      location: "bhatinda",
      description: "HMEL Bhatinda",
      createdById: ownerUser.id,
    },
  });

  // Create Site In-Charge users
  const siteInCharge1 = await prisma.user.upsert({
    where: { email: "narayan@warehouse.com" },
    update: {},
    create: {
      email: "narayan@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Narayan Vanzara",
      role: Role.SITE_INCHARGE,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: ownerUser.id,
    },
  });

  const siteInCharge2 = await prisma.user.upsert({
    where: { email: "pradip@warehouse.com" },
    update: {},
    create: {
      email: "pradip@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Pradip Patel",
      role: Role.SITE_INCHARGE,
      status: UserStatus.ACTIVE,
      siteId: site2.id,
      superiorId: ownerUser.id,
    },
  });

  const siteInCharge3 = await prisma.user.upsert({
    where: { email: "xyz@warehouse.com" },
    update: {},
    create: {
      email: "xyz@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "XYZ",
      role: Role.SITE_INCHARGE,
      status: UserStatus.ACTIVE,
      siteId: site3.id,
      superiorId: ownerUser.id,
    },
  });

  // Create Site Supervisor users
  const siteSupervisor1 = await prisma.user.upsert({
    where: { email: "som@warehouse.com" },
    update: {},
    create: {
      email: "som@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Som Bhai",
      role: Role.SITE_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: siteInCharge1.id,
    },
  });

  const siteSupervisor2 = await prisma.user.upsert({
    where: { email: "kiran@warehouse.com" },
    update: {},
    create: {
      email: "kiran@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Kiran",
      role: Role.SITE_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: siteInCharge1.id,
    },
  });

  const siteSupervisor3 = await prisma.user.upsert({
    where: { email: "vora@warehouse.com" },
    update: {},
    create: {
      email: "vora@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Vora",
      role: Role.SITE_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: siteInCharge1.id,
    },
  });

  // Create Cluster Supervisor users
  const clusterSupervisor1 = await prisma.user.upsert({
    where: { email: "abc@warehouse.com" },
    update: {},
    create: {
      email: "abc@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "ABC",
      role: Role.CLUSTER_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: siteSupervisor1.id,
    },
  });

  const clusterSupervisor2 = await prisma.user.upsert({
    where: { email: "xyz@warehouse.com" },
    update: {},
    create: {
      email: "xyz@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "XYZ",
      role: Role.CLUSTER_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: siteSupervisor1.id,
    },
  });

  // Create sample devices with jobs for site 1

  // Seed sample resources

  console.log("Created sample resources");

  // Insert 30 Heat Exchanger devices for site 1
  const jobNames = [
    "blinding",
    "channel and floating head dome",
    "bundle pulling",
    "bundle cleaning",
    "shell cleaning",
    "bundle cleaning and shifting",
    "bundle boxing",
    "shell side hydrotesting",
    "tube side hydrotesting",
    "final hydrotesting",
    "deblinding",
  ];
  let deviceCount = 1;
  for (let i = 1; i <= 30; i++) {
    const serial = `HE-${String(i).padStart(3, "0")}`;
    const device = await prisma.device.create({
      data: {
        serialNumber: serial,
        name: `Heat Exchanger ${i}`,
        type: "Heat Exchanger",
        siteId: site1.id,
        createdBy: siteInCharge1.id,
        priority:
          deviceCount % 4 === 0
            ? DevicePriority.EXTREME
            : deviceCount % 3 === 0
            ? DevicePriority.HIGH
            : deviceCount % 2 === 0
            ? DevicePriority.MEDIUM
            : DevicePriority.LOW,
        targetDate:
          deviceCount % 3 === 0
            ? new Date(Date.now() + deviceCount * 24 * 60 * 60 * 1000)
            : null, // Some devices have target dates
        attributes: {
          no_of_tubes: 100 + i,
          exchanger_length: `${5 + i * 0.1} m`,
          tube_bundle_length: `${4 + i * 0.1} m`,
          tube_bundle_weight: `${1000 + i * 10} kg`,
          exchanger_weight: `${2000 + i * 10} kg`,
          location: `Bay ${Math.ceil(i / 2)}`,
        },
      },
    });
    // Create jobs with mixed statuses
    const jobsData = jobNames.map((name, index) => {
      let status = JobStatus.PENDING; // Default to PENDING
      let comment = null;
      let updatedBy = null;

      // Some jobs are completed (first few jobs of some devices)
      if (index < 3 && deviceCount % 8 === 0) {
        status = JobStatus.COMPLETED;
      }
      // Some jobs are in progress (middle jobs of some devices)
      else if (index >= 3 && index < 6 && deviceCount % 6 === 0) {
        status = JobStatus.IN_PROGRESS;
      }
      // Some jobs have constraints (first job of some devices)
      else if (index === 0 && deviceCount % 5 === 0) {
        status = JobStatus.CONSTRAINT;
        comment = "Equipment malfunction - waiting for replacement parts";
        updatedBy = clusterSupervisor1.id;
      }

      return {
        deviceId: device.id,
        deviceType: device.type,
        name,
        status,
        comment,
        updatedBy,
      };
    });

    await prisma.job.createMany({
      data: jobsData,
    });
    deviceCount++;
  }

  console.log("Created sample jobs for all devices");

  // Insert 20 Vessel devices for site 1
  const vesselJobNames = [
    "Blinding",
    "vessel entry",
    "Internal cleaning",
    "Inspection",
    "fabrication and repair",
    "second inspection",
    "boxup",
    "Pneumatic test",
    "Hydrotesting",
    "Deblinding",
  ];
  for (let i = 1; i <= 20; i++) {
    const serial = `VSL-${String(i).padStart(3, "0")}`;
    const device = await prisma.device.create({
      data: {
        serialNumber: serial,
        name: `Vessel ${i}`,
        type: "Vessel",
        siteId: site1.id,
        createdBy: siteInCharge1.id,
        priority:
          i % 4 === 0
            ? DevicePriority.EXTREME
            : i % 3 === 0
            ? DevicePriority.HIGH
            : i % 2 === 0
            ? DevicePriority.MEDIUM
            : DevicePriority.LOW,
        targetDate:
          i % 4 === 0 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000) : null, // Some vessels are delayed
        attributes: {
          diameter: `${2 + i * 0.1} m`,
          height: `${5 + i * 0.2} m`,
          volume: `${10 + i * 0.5} m3`,
          Hydrotest_Pr: `${10 + i} bar`,
          Pneumatic_ar_water: `${5 + i} bar`,
        },
      },
    });
    // Create jobs with mixed statuses
    const vesselJobsData = vesselJobNames.map((name, index) => {
      let status = JobStatus.PENDING; // Default to PENDING
      let comment = null;
      let updatedBy = null;

      // Some jobs are completed (first few jobs of some vessels)
      if (index < 2 && i % 9 === 0) {
        status = JobStatus.COMPLETED;
      }
      // Some jobs are in progress (middle jobs of some vessels)
      else if (index >= 2 && index < 5 && i % 7 === 0) {
        status = JobStatus.IN_PROGRESS;
      }
      // Some jobs have constraints (third job of some vessels)
      else if (index === 2 && i % 7 === 0) {
        status = JobStatus.CONSTRAINT;
        comment = "Safety inspection required - access restricted";
        updatedBy = clusterSupervisor2.id;
      }

      return {
        deviceId: device.id,
        deviceType: device.type,
        name,
        status,
        comment,
        updatedBy,
      };
    });

    await prisma.job.createMany({
      data: vesselJobsData,
    });
  }

  console.log("Created sample jobs for all devices");

  // Insert 20 Column devices for site 1
  const columnJobNames = [
    "blinding",
    "manhole open",
    "vessel entry",
    "manual opening",
    "tray remover",
    "internal cleaning",
    "Inspecting",
    "Recommendation",
    "Fabrication",
    "tray boxup",
    "manual boxup",
    "Inspection",
  ];
  for (let i = 1; i <= 20; i++) {
    const serial = `COL-${String(i).padStart(3, "0")}`;
    const device = await prisma.device.create({
      data: {
        serialNumber: serial,
        name: `Column ${i}`,
        type: "Column",
        siteId: site1.id,
        createdBy: siteInCharge1.id,
        priority:
          i % 4 === 0
            ? DevicePriority.EXTREME
            : i % 3 === 0
            ? DevicePriority.HIGH
            : i % 2 === 0
            ? DevicePriority.MEDIUM
            : DevicePriority.LOW,
        targetDate:
          i % 5 === 0
            ? new Date(Date.now() + i * 2 * 24 * 60 * 60 * 1000)
            : null, // Some columns have future target dates
        attributes: {
          no_of_trays: 10 + i,
          height: `${20 + i * 0.5} m`,
          diameter: `${2 + i * 0.05} m`,
          wear_gap: `${0.5 + i * 0.01} m`,
          wear_height: `${1 + i * 0.02} m`,
        },
      },
    });
    // Create jobs with mixed statuses
    const columnJobsData = columnJobNames.map((name, index) => {
      let status = JobStatus.PENDING; // Default to PENDING
      let comment = null;
      let updatedBy = null;

      // Some jobs are completed (first few jobs of some columns)
      if (index < 4 && i % 10 === 0) {
        status = JobStatus.COMPLETED;
      }
      // Some jobs are in progress (middle jobs of some columns)
      else if (index >= 4 && index < 8 && i % 8 === 0) {
        status = JobStatus.IN_PROGRESS;
      }
      // Some jobs have constraints (sixth job of some columns)
      else if (index === 5 && i % 6 === 0) {
        status = JobStatus.CONSTRAINT;
        comment = "Material shortage - waiting for delivery";
        updatedBy = clusterSupervisor2.id;
      }

      return {
        deviceId: device.id,
        deviceType: device.type,
        name,
        status,
        comment,
        updatedBy,
      };
    });

    await prisma.job.createMany({
      data: columnJobsData,
    });
  }

  console.log("Created sample jobs for all devices");

  // Insert 10 HPWJ resources (unallocated)
  for (let i = 1; i <= 10; i++) {
    await prisma.resource.create({
      data: {
        name: `HPWJ ${i}`,
        regNo: `HPWJ-${String(i).padStart(3, "0")}`,
        type: "HPWJ",
        status: "FREE",
        attributes: {
          capacity: `${100 + i * 10} bar`,
          lances: 2 + (i % 3),
          make: ["Karcher", "Jetstream", "AquaDyne"][i % 3],
        },
        siteId: null,
        allocatedAt: null,
      },
    });
  }
  // Insert 10 Scaffolding resources (unallocated)
  for (let i = 1; i <= 10; i++) {
    await prisma.resource.create({
      data: {
        name: `Scaffolding ${i}`,
        regNo: `SCF-${String(i).padStart(3, "0")}`,
        type: "Scaffolding",
        status: "FREE",
        attributes: {
          pipes: 50 + i * 5,
          clamps: 100 + i * 10,
          gratings: 10 + i,
        },
        siteId: null,
        allocatedAt: null,
      },
    });
  }

  console.log("Database seeding completed successfully!");
  console.log("\nSample login credentials:");
  console.log("Owner: owner@warehouse.com / password123");
  console.log("Site In-Charge 1: incharge1@warehouse.com / password123");
  console.log("Site In-Charge 2: incharge2@warehouse.com / password123");
  console.log("Site Supervisor 1: supervisor1@warehouse.com / password123");
  console.log("Site Supervisor 2: supervisor2@warehouse.com / password123");
  console.log("Cluster Supervisor 1: cluster1@warehouse.com / password123");
  console.log("Cluster Supervisor 2: cluster2@warehouse.com / password123");
  console.log("Cluster Supervisor 3: cluster3@warehouse.com / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
