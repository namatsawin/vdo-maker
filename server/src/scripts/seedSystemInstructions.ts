import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSystemInstructions() {
  try {
    // Create a system user first if it doesn't exist
    let systemUser = await prisma.user.findUnique({
      where: { email: 'system@vdo-maker.com' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@vdo-maker.com',
          name: 'System',
          password: 'system' // This won't be used for login
        }
      });
    }

    // Check if default instructions already exist
    const existingInstructions = await prisma.systemInstruction.findMany({
      where: { isDefault: true }
    });

    if (existingInstructions.length > 0) {
      console.log('Default system instructions already exist');
      return;
    }

    // Insert default system instructions
    const defaultInstructions = [
      {
        id: 'default_general',
        name: 'General Video Script',
        description: 'General purpose video script generation',
        instruction: 'You are an expert video script writer. Create engaging, well-structured video scripts that are clear, concise, and compelling. Break down complex topics into digestible segments. Each segment should have a clear purpose and smooth transitions.',
        category: 'general',
        isDefault: true,
        createdBy: systemUser.id
      },
      {
        id: 'default_educational',
        name: 'Educational Content',
        description: 'For educational and tutorial videos',
        instruction: 'You are an educational content creator. Create informative, step-by-step video scripts that help viewers learn effectively. Use clear explanations, examples, and logical progression. Make complex topics accessible and engaging.',
        category: 'educational',
        isDefault: false,
        createdBy: systemUser.id
      },
      {
        id: 'default_marketing',
        name: 'Marketing & Promotional',
        description: 'For marketing and promotional videos',
        instruction: 'You are a marketing copywriter specializing in video content. Create persuasive, engaging scripts that highlight benefits, create urgency, and drive action. Focus on storytelling and emotional connection while maintaining professionalism.',
        category: 'marketing',
        isDefault: false,
        createdBy: systemUser.id
      },
      {
        id: 'default_entertainment',
        name: 'Entertainment',
        description: 'For entertainment and storytelling videos',
        instruction: 'You are a creative storyteller. Create engaging, entertaining video scripts with compelling narratives, interesting characters, and captivating plots. Focus on keeping viewers engaged throughout the entire video.',
        category: 'entertainment',
        isDefault: false,
        createdBy: systemUser.id
      }
    ];

    for (const instruction of defaultInstructions) {
      await prisma.systemInstruction.create({
        data: instruction
      });
    }

    console.log('Default system instructions created successfully');
  } catch (error) {
    console.error('Error seeding system instructions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSystemInstructions();
