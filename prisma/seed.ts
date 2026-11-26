import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const password = "Password123!";

async function upsertUser(input: {
  email: string;
  name: string;
  role: string;
  headline: string;
  bio: string;
  location: string;
  availability?: string;
}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    update: {
      name: input.name,
      role: input.role,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  await db.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: input.name,
      headline: input.headline,
      bio: input.bio,
      location: input.location,
      availability: input.availability,
      visibility: "PUBLIC",
      openToOpportunities: true,
    },
    update: {
      name: input.name,
      headline: input.headline,
      bio: input.bio,
      location: input.location,
      availability: input.availability,
    },
  });

  return user;
}

async function main() {
  const student = await upsertUser({
    email: "student@linkedout.local",
    name: "Amara Okafor",
    role: "STUDENT",
    headline: "Final-year software engineering student",
    bio: "Building reliable web products and learning from real teams. Interested in frontend engineering, data, and product design.",
    location: "Manchester, UK",
    availability: "Open to internships from June",
  });

  const studentTwo = await upsertUser({
    email: "student2@linkedout.local",
    name: "Jonas Meyer",
    role: "STUDENT",
    headline: "Data analytics student",
    bio: "Turning messy datasets into decisions. Currently learning SQL, Python, and dashboard design.",
    location: "Berlin, Germany",
  });

  const trainer = await upsertUser({
    email: "trainer@linkedout.local",
    name: "Priya Raman",
    role: "TRAINER",
    headline: "Lead trainer, professional skills",
    bio: "I run applied training programmes that help learners build confidence and visible evidence of their work.",
    location: "London, UK",
  });

  const companyUser = await upsertUser({
    email: "company@linkedout.local",
    name: "Daniel Foster",
    role: "COMPANY",
    headline: "Talent lead at Northstar Labs",
    bio: "Connecting emerging talent with meaningful engineering work.",
    location: "Bristol, UK",
  });

  await upsertUser({
    email: "admin@linkedout.local",
    name: "Alex Morgan",
    role: "ADMIN",
    headline: "Platform administrator",
    bio: "Keeping the LinkedOut community safe, useful, and welcoming.",
    location: "Remote",
  });

  const skillNames = [
    "TypeScript",
    "React",
    "SQL",
    "Python",
    "Product Design",
    "Communication",
    "Data Analysis",
    "Project Management",
  ];

  const skills = await Promise.all(
    skillNames.map((name) =>
      db.skill.upsert({
        where: { name },
        create: { name, category: "Professional" },
        update: {},
      }),
    ),
  );

  const studentProfile = await db.profile.findUniqueOrThrow({
    where: { userId: student.id },
  });
  const trainerProfile = await db.profile.findUniqueOrThrow({
    where: { userId: trainer.id },
  });

  await Promise.all(
    [
      [skills[0], "Advanced", 3],
      [skills[1], "Proficient", 2],
      [skills[2], "Developing", 1],
    ].map(([skill, level, years]) =>
      db.profileSkill.upsert({
        where: {
          profileId_skillId: {
            profileId: studentProfile.id,
            skillId: (skill as { id: string }).id,
          },
        },
        create: {
          profileId: studentProfile.id,
          skillId: (skill as { id: string }).id,
          level: level as string,
          years: years as number,
        },
        update: {},
      }),
    ),
  );

  await db.profileSkill.upsert({
    where: {
      profileId_skillId: {
        profileId: trainerProfile.id,
        skillId: skills[5].id,
      },
    },
    create: {
      profileId: trainerProfile.id,
      skillId: skills[5].id,
      level: "Expert",
      years: 12,
    },
    update: {},
  });

  if ((await db.qualification.count({ where: { profileId: studentProfile.id } })) === 0) {
    await db.qualification.create({
      data: {
        profileId: studentProfile.id,
        title: "BSc Software Engineering",
        institution: "University of Manchester",
        year: 2026,
      },
    });
    await db.experience.create({
      data: {
        profileId: studentProfile.id,
        title: "Frontend Engineering Intern",
        organisation: "Civic Studio",
        startDate: "2025-06",
        endDate: "2025-09",
        description: "Built accessible React interfaces and contributed to the component library.",
      },
    });
    await db.project.create({
      data: {
        profileId: studentProfile.id,
        title: "Study Coach",
        description:
          "A revision planner that helps students prioritise topics using spaced repetition.",
        url: "https://example.com/study-coach",
        tags: "React, TypeScript, Accessibility",
      },
    });
    await db.achievement.create({
      data: {
        profileId: studentProfile.id,
        title: "Hackathon finalist",
        description: "Shortlisted among 40 teams for a national student hackathon.",
        issuedBy: "National Student Hackathon",
        issuedAt: "2025-03",
      },
    });
    await db.portfolioItem.create({
      data: {
        profileId: studentProfile.id,
        title: "Study Coach case study",
        description: "Problem, research, design decisions, and outcome.",
        url: "https://example.com/study-coach-case-study",
        kind: "LINK",
      },
    });
  }

  const company = await db.company.upsert({
    where: { slug: "northstar-labs" },
    create: {
      name: "Northstar Labs",
      slug: "northstar-labs",
      website: "https://example.com/northstar",
      industry: "Technology",
      location: "Bristol, UK",
      description:
        "Northstar Labs builds practical software for growing organisations and mentors early-career engineers.",
      ownerId: companyUser.id,
      verified: true,
    },
    update: {},
  });

  await db.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: companyUser.id } },
    create: { companyId: company.id, userId: companyUser.id, role: "OWNER" },
    update: {},
  });

  const opportunity = await db.opportunity.findFirst({
    where: { companyId: company.id, title: "Frontend Engineering Intern" },
  });

  const opportunityRecord =
    opportunity ??
    (await db.opportunity.create({
      data: {
        companyId: company.id,
        title: "Frontend Engineering Intern",
        type: "INTERNSHIP",
        location: "Bristol / Hybrid",
        description:
          "Work with our product team to build and ship customer-facing features. You will be paired with a senior engineer and have dedicated learning time each week.",
        requirements: "Some experience with JavaScript or TypeScript. Curiosity and clear communication.",
        status: "OPEN",
      },
    }));

  await db.application.upsert({
    where: {
      opportunityId_userId: {
        opportunityId: opportunityRecord.id,
        userId: student.id,
      },
    },
    create: { opportunityId: opportunityRecord.id, userId: student.id, status: "REVIEWING" },
    update: {},
  });

  const program = await db.program.upsert({
    where: { slug: "professional-product-engineering" },
    create: {
      title: "Professional Product Engineering",
      slug: "professional-product-engineering",
      summary: "An applied programme covering delivery, collaboration, and product thinking.",
      description:
        "Eight weeks of practical training with weekly sessions, applied assignments, and a portfolio-ready final project.",
      trainerId: trainer.id,
      status: "PUBLISHED",
      startDate: "2026-01-12",
      endDate: "2026-03-06",
    },
    update: {},
  });

  const cohort = await db.cohort.upsert({
    where: { programId_name: { programId: program.id, name: "Cohort 1" } },
    create: {
      programId: program.id,
      name: "Cohort 1",
      startDate: "2026-01-12",
      endDate: "2026-03-06",
      capacity: 30,
    },
    update: {},
  });

  if ((await db.module.count({ where: { programId: program.id } })) === 0) {
    const moduleOne = await db.module.create({
      data: {
        programId: program.id,
        title: "Working in product teams",
        description: "How requirements, delivery, and feedback work together.",
        position: 1,
      },
    });
    await db.trainingSession.create({
      data: {
        moduleId: moduleOne.id,
        title: "From problem to delivery",
        description: "A practical walkthrough of a product team workflow.",
        content: "Watch the recording, then add one example to your learning log.",
        position: 1,
      },
    });
    await db.assignment.create({
      data: {
        moduleId: moduleOne.id,
        title: "Product brief analysis",
        description:
          "Choose a product you use regularly. Write a one-page brief covering the user, problem, constraints, and one measurable improvement.",
        dueAt: "2026-01-19",
        maxScore: 100,
      },
    });

    const moduleTwo = await db.module.create({
      data: {
        programId: program.id,
        title: "Evidence and portfolio",
        description: "Turn your work into clear evidence for future employers.",
        position: 2,
      },
    });
    await db.trainingSession.create({
      data: {
        moduleId: moduleTwo.id,
        title: "Telling your project story",
        description: "Structuring a case study that reviewers can scan quickly.",
        content: "Prepare a 300-word case study using the situation-action-result structure.",
        position: 1,
      },
    });
    await db.assignment.create({
      data: {
        moduleId: moduleTwo.id,
        title: "Portfolio case study",
        description:
          "Write a case study for one project that explains your contribution, decisions, and outcome.",
        dueAt: "2026-02-02",
        maxScore: 100,
      },
    });
  }

  const enrollment = await db.enrollment.upsert({
    where: { cohortId_userId: { cohortId: cohort.id, userId: student.id } },
    create: { cohortId: cohort.id, userId: student.id, status: "ENROLLED", progress: 0 },
    update: {},
  });

  const firstAssignment = await db.assignment.findFirst({
    where: { module: { programId: program.id } },
    orderBy: { createdAt: "asc" },
  });

  if (firstAssignment) {
    const submission = await db.submission.upsert({
      where: {
        assignmentId_userId: { assignmentId: firstAssignment.id, userId: student.id },
      },
      create: {
        assignmentId: firstAssignment.id,
        userId: student.id,
        enrollmentId: enrollment.id,
        note: "Brief for a local volunteering platform.",
        status: "GRADED",
      },
      update: {},
    });

    await db.grade.upsert({
      where: { submissionId: submission.id },
      create: {
        submissionId: submission.id,
        score: 88,
        feedback: "Clear analysis. Add more detail on how you would measure the improvement.",
        gradedById: trainer.id,
      },
      update: {},
    });
  }

  if ((await db.progressEvent.count({ where: { enrollmentId: enrollment.id } })) === 0) {
    await db.progressEvent.createMany({
      data: [
        {
          enrollmentId: enrollment.id,
          kind: "SESSION_COMPLETE",
          description: "Completed: From problem to delivery",
        },
        {
          enrollmentId: enrollment.id,
          kind: "ASSIGNMENT_GRADED",
          description: "Product brief analysis graded",
          scoreDelta: 88,
        },
      ],
    });
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { progress: 50 },
    });
  }

  await db.connection.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: student.id,
        addresseeId: trainer.id,
      },
    },
    create: {
      requesterId: student.id,
      addresseeId: trainer.id,
      status: "ACCEPTED",
      message: "I enjoyed your session on product briefs.",
    },
    update: {},
  });

  await db.connection.upsert({
    where: {
      requesterId_addresseeId: {
        requesterId: student.id,
        addresseeId: companyUser.id,
      },
    },
    create: {
      requesterId: student.id,
      addresseeId: companyUser.id,
      status: "PENDING",
      message: "I would love to learn more about your internship programme.",
    },
    update: {},
  });

  const [user1, user2] = [student.id, companyUser.id].sort();
  const thread = await db.messageThread.upsert({
    where: { user1Id_user2Id: { user1Id: user1, user2Id: user2 } },
    create: { user1Id: user1, user2Id: user2, companyId: company.id },
    update: {},
  });

  if ((await db.message.count({ where: { threadId: thread.id } })) === 0) {
    await db.message.createMany({
      data: [
        {
          threadId: thread.id,
          senderId: student.id,
          body: "Hi Daniel, thanks for connecting. Is the internship open to final-year students?",
        },
        {
          threadId: thread.id,
          senderId: companyUser.id,
          body: "Yes, final-year students are very welcome. I will share the application details this week.",
        },
      ],
    });
  }

  if ((await db.post.count()) === 0) {
    await db.post.create({
      data: {
        authorId: student.id,
        type: "PROJECT",
        body: "I finished the first version of Study Coach this weekend. It helps me plan revision around the topics I find hardest. Next step: adding reminders and accessibility improvements.",
      },
    });
    await db.post.create({
      data: {
        authorId: trainer.id,
        type: "KNOWLEDGE",
        body: "A useful habit for early-career engineers: before you build, write down who the user is, what they need, and how you will know the change worked. One short paragraph is enough.",
      },
    });
    await db.post.create({
      data: {
        companyId: company.id,
        authorId: companyUser.id,
        type: "OPPORTUNITY",
        body: "Our frontend engineering internship is now open. We are looking for curious people who enjoy solving real problems with thoughtful interfaces. Apply through the Opportunities page.",
      },
    });
    await db.post.create({
      data: {
        authorId: studentTwo.id,
        type: "ACHIEVEMENT",
        body: "I completed my first SQL certification today. Next up: building a public dashboard with real open data.",
      },
    });
  }

  await db.notification.upsert({
    where: { id: "seed-notification-1" },
    create: {
      id: "seed-notification-1",
      userId: student.id,
      type: "APPLICATION",
      title: "Your application is being reviewed",
      body: "Northstar Labs has moved your application to reviewing.",
      href: "/opportunities",
    },
    update: {},
  });

  await db.activityEvent.create({
    data: {
      userId: student.id,
      type: "PROFILE_VIEW",
      entityType: "PROFILE",
      entityId: studentProfile.id,
    },
  });

  console.log("Seed complete.");
  console.log("Demo accounts:");
  console.log(`  student@linkedout.local / ${password}`);
  console.log(`  trainer@linkedout.local / ${password}`);
  console.log(`  company@linkedout.local / ${password}`);
  console.log(`  admin@linkedout.local / ${password}`);
  console.log(`  student2@linkedout.local / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
