import prisma from './prisma.js'

export async function getDailySession(userId: string) {
  
  // 1. get revision question — due today based on SM-2
  const revisionQuestion = await prisma.revisionSchedule.findFirst({
    where: {
      userId,
      nextReviewDate: {
        lte: new Date() // less than or equal to today
      }
    },
    include: {
      problem: true
    },
    orderBy: {
      nextReviewDate: 'asc' // most overdue first
    }
  })

  // 2. get the user's current topic
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { currentTopic: true }
  })

  if (!user || !user.currentTopicId) {
    return { error: 'User or current topic not found' }
  }

  // 3. get today's topic question — next unsolved problem in current topic
  const topicQuestion = await prisma.problem.findFirst({
    where: {
      topicId: user.currentTopicId,
      userProgress: {
        none: {
          userId, // problems the user has NOT solved yet
        }
      }
    },
    orderBy: {
      orderIndex: 'asc'
    }
  })

  // 4. streak protector — random easy or medium problem in current topic
  let streakQuestion = null
  if (user.streakProtector) {
    const count = await prisma.problem.count({
      where: {
        topicId: user.currentTopicId,
        difficulty: { in: ['EASY', 'MEDIUM'] }
      }
    })
    const skip = Math.floor(Math.random() * count)
    streakQuestion = await prisma.problem.findFirst({
      where: {
        topicId: user.currentTopicId,
        difficulty: { in: ['EASY', 'MEDIUM'] }
      },
      skip
    })
  }

  return {
    revisionQuestion: revisionQuestion?.problem ?? null,
    topicQuestion,
    streakQuestion
  }
}