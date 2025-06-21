const { PrismaClient, Role, UserStatus, JobStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Create Owner user
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@warehouse.com" },
    update: {},
    create: {
      email: "owner@warehouse.com",
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
      name: "Warehouse North",
      location: "North District",
      description: "Primary warehouse facility in the north region",
      createdById: ownerUser.id,
    },
  });

  const site2 = await prisma.site.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Warehouse South",
      location: "South District",
      description: "Secondary warehouse facility in the south region",
      createdById: ownerUser.id,
    },
  });

  console.log("Created sites:", site1.name, site2.name);

  // Create Site In-Charge users
  const siteInCharge1 = await prisma.user.upsert({
    where: { email: "incharge1@warehouse.com" },
    update: {},
    create: {
      email: "incharge1@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "John Site Manager",
      role: Role.SITE_INCHARGE,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: ownerUser.id,
    },
  });

  const siteInCharge2 = await prisma.user.upsert({
    where: { email: "incharge2@warehouse.com" },
    update: {},
    create: {
      email: "incharge2@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Sarah Site Manager",
      role: Role.SITE_INCHARGE,
      status: UserStatus.ACTIVE,
      siteId: site2.id,
      superiorId: ownerUser.id,
    },
  });

  console.log(
    "Created site in-charges:",
    siteInCharge1.name,
    siteInCharge2.name
  );

  // Create Site Supervisor users
  const siteSupervisor1 = await prisma.user.upsert({
    where: { email: "supervisor1@warehouse.com" },
    update: {},
    create: {
      email: "supervisor1@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Mike Supervisor",
      role: Role.SITE_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: siteInCharge1.id,
    },
  });

  const siteSupervisor2 = await prisma.user.upsert({
    where: { email: "supervisor2@warehouse.com" },
    update: {},
    create: {
      email: "supervisor2@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Lisa Supervisor",
      role: Role.SITE_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site2.id,
      superiorId: siteInCharge2.id,
    },
  });

  console.log(
    "Created site supervisors:",
    siteSupervisor1.name,
    siteSupervisor2.name
  );

  // Create Cluster Supervisor users
  const clusterSupervisor1 = await prisma.user.upsert({
    where: { email: "cluster1@warehouse.com" },
    update: {},
    create: {
      email: "cluster1@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Alex Cluster Manager",
      role: Role.CLUSTER_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: siteSupervisor1.id,
    },
  });

  const clusterSupervisor2 = await prisma.user.upsert({
    where: { email: "cluster2@warehouse.com" },
    update: {},
    create: {
      email: "cluster2@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "Emma Cluster Manager",
      role: Role.CLUSTER_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site1.id,
      superiorId: siteSupervisor1.id,
    },
  });

  const clusterSupervisor3 = await prisma.user.upsert({
    where: { email: "cluster3@warehouse.com" },
    update: {},
    create: {
      email: "cluster3@warehouse.com",
      passwordHash: await bcrypt.hash("password123", 10),
      name: "David Cluster Manager",
      role: Role.CLUSTER_SUPERVISOR,
      status: UserStatus.ACTIVE,
      siteId: site2.id,
      superiorId: siteSupervisor2.id,
    },
  });

  console.log(
    "Created cluster supervisors:",
    clusterSupervisor1.name,
    clusterSupervisor2.name,
    clusterSupervisor3.name
  );

  // Create sample devices with jobs for site 1
  const device1 = await prisma.device.upsert({
    where: { serialNumber: "HE-001" },
    update: {},
    create: {
      serialNumber: "HE-001",
      name: "Heat Exchanger Unit 1",
      type: "Heat Exchanger",
      subtype: "Floating",
      siteId: site1.id,
      createdBy: siteInCharge1.id,
      assignedTo: clusterSupervisor1.id,
      attributes: {
        capacity: "2000 BTU/hr",
        material: "Stainless Steel",
        pressure_rating: "150 PSI",
      },
    },
  });

  const device2 = await prisma.device.upsert({
    where: { serialNumber: "PUMP-001" },
    update: {},
    create: {
      serialNumber: "PUMP-001",
      name: "Centrifugal Pump 1",
      type: "Pump",
      subtype: "Fixed",
      siteId: site1.id,
      createdBy: siteInCharge1.id,
      assignedTo: clusterSupervisor2.id,
      attributes: {
        flow_rate: "100 GPM",
        head: "50 ft",
        power: "5 HP",
      },
    },
  });

  // Create sample devices for site 2
  const device3 = await prisma.device.upsert({
    where: { serialNumber: "HE-002" },
    update: {},
    create: {
      serialNumber: "HE-002",
      name: "Heat Exchanger Unit 2",
      type: "Heat Exchanger",
      subtype: "Fixed",
      siteId: site2.id,
      createdBy: siteInCharge2.id,
      assignedTo: clusterSupervisor3.id,
      attributes: {
        capacity: "3000 BTU/hr",
        material: "Carbon Steel",
        pressure_rating: "200 PSI",
      },
    },
  });

  console.log("Created devices:", device1.name, device2.name, device3.name);

  // Create jobs for device 1
  await prisma.job.createMany({
    skipDuplicates: true,
    data: [
      {
        deviceId: device1.id,
        name: "Pressure Test",
        status: JobStatus.IN_PROGRESS,
      },
      {
        deviceId: device1.id,
        name: "Leak Check",
        status: JobStatus.IN_PROGRESS,
      },
      {
        deviceId: device1.id,
        name: "Performance Calibration",
        status: JobStatus.COMPLETED,
      },
    ],
  });

  // Create jobs for device 2
  await prisma.job.createMany({
    skipDuplicates: true,
    data: [
      {
        deviceId: device2.id,
        name: "Flow Rate Test",
        status: JobStatus.IN_PROGRESS,
      },
      {
        deviceId: device2.id,
        name: "Vibration Analysis",
        status: JobStatus.IN_PROGRESS,
      },
      {
        deviceId: device2.id,
        name: "Motor Alignment",
        status: JobStatus.CONSTRAINT,
        comment: "Motor bearing needs replacement",
      },
    ],
  });

  // Create jobs for device 3
  await prisma.job.createMany({
    skipDuplicates: true,
    data: [
      {
        deviceId: device3.id,
        name: "Thermal Efficiency Test",
        status: JobStatus.IN_PROGRESS,
      },
      {
        deviceId: device3.id,
        name: "Tube Cleaning",
        status: JobStatus.COMPLETED,
      },
      {
        deviceId: device3.id,
        name: "Safety Valve Test",
        status: JobStatus.IN_PROGRESS,
      },
    ],
  });

  console.log("Created sample jobs for all devices");

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
