import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { CoachAthleteStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { AssignWorkoutDto } from './dto/assign-workout.dto';
import { CreateCoachProfileDto } from './dto/create-coach-profile.dto';
import { ReviewAssignmentDto } from './dto/review-assignment.dto';

const relationshipInclude = {
  coachProfile: {
    select: { id: true, displayName: true, bio: true },
  },
  athleteProfile: {
    select: {
      id: true,
      displayName: true,
      user: { select: { email: true } },
    },
  },
} satisfies Prisma.CoachAthleteRelationshipInclude;

@Injectable()
export class CoachesService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        coachProfile: true,
        athleteProfile: { select: { id: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const athleteRelationships = user.athleteProfile
      ? await this.prisma.coachAthleteRelationship.findMany({
          where: {
            athleteProfileId: user.athleteProfile.id,
            status: {
              in: [CoachAthleteStatus.PENDING, CoachAthleteStatus.ACTIVE],
            },
          },
          include: relationshipInclude,
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const relationships = user.coachProfile
      ? await this.prisma.coachAthleteRelationship.findMany({
          where: {
            coachProfileId: user.coachProfile.id,
            status: {
              in: [CoachAthleteStatus.PENDING, CoachAthleteStatus.ACTIVE],
            },
          },
          include: relationshipInclude,
          orderBy: { createdAt: 'desc' },
        })
      : [];

    return {
      coachProfile: user.coachProfile,
      receivedInvitations: athleteRelationships.filter(
        (relationship) => relationship.status === CoachAthleteStatus.PENDING,
      ),
      coaches: athleteRelationships.filter(
        (relationship) => relationship.status === CoachAthleteStatus.ACTIVE,
      ),
      athletes: relationships.filter(
        (relationship) => relationship.status === CoachAthleteStatus.ACTIVE,
      ),
      sentInvitations: relationships.filter(
        (relationship) => relationship.status === CoachAthleteStatus.PENDING,
      ),
    };
  }

  async createProfile(userId: string, dto: CreateCoachProfileDto) {
    const displayName = dto.displayName.trim();
    if (!displayName) throw new BadRequestException('Display name is required');

    return this.prisma.coachProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName,
        bio: dto.bio?.trim() || null,
      },
      update: {
        displayName,
        bio: dto.bio?.trim() || null,
      },
    });
  }

  async getAssignmentOptions(userId: string) {
    await this.getCoach(userId);
    const [workouts, prescriptionCategories] = await Promise.all([
      this.prisma.workout.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          isBenchmark: true,
          type: { select: { key: true, name: true } },
          variants: {
            select: {
              id: true,
              name: true,
              level: { select: { key: true, name: true } },
            },
          },
        },
      }),
      this.prisma.prescriptionCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        select: { key: true, name: true },
      }),
    ]);
    return { workouts, prescriptionCategories };
  }

  async inviteAthlete(userId: string, email: string) {
    const coach = await this.getCoach(userId);
    const athlete = await this.prisma.athleteProfile.findFirst({
      where: { user: { email: { equals: email.trim(), mode: 'insensitive' } } },
      include: { user: { select: { email: true } } },
    });

    if (!athlete) throw new NotFoundException('Athlete not found');
    if (athlete.userId === userId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const existing = await this.prisma.coachAthleteRelationship.findUnique({
      where: {
        coachProfileId_athleteProfileId: {
          coachProfileId: coach.id,
          athleteProfileId: athlete.id,
        },
      },
    });

    if (existing?.status === CoachAthleteStatus.ACTIVE) {
      throw new ConflictException('Athlete is already connected');
    }

    return this.prisma.coachAthleteRelationship.upsert({
      where: {
        coachProfileId_athleteProfileId: {
          coachProfileId: coach.id,
          athleteProfileId: athlete.id,
        },
      },
      create: {
        coachProfileId: coach.id,
        athleteProfileId: athlete.id,
      },
      update: { status: CoachAthleteStatus.PENDING },
      include: relationshipInclude,
    });
  }

  async respondToInvitation(
    userId: string,
    relationshipId: string,
    response: 'ACCEPT' | 'DECLINE',
  ) {
    const athlete = await this.getAthlete(userId);
    const relationship = await this.prisma.coachAthleteRelationship.findFirst({
      where: {
        id: relationshipId,
        athleteProfileId: athlete.id,
        status: CoachAthleteStatus.PENDING,
      },
    });

    if (!relationship) throw new NotFoundException('Invitation not found');

    return this.prisma.coachAthleteRelationship.update({
      where: { id: relationship.id },
      data: {
        status:
          response === 'ACCEPT'
            ? CoachAthleteStatus.ACTIVE
            : CoachAthleteStatus.ARCHIVED,
      },
      include: relationshipInclude,
    });
  }

  async archiveRelationship(userId: string, relationshipId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        coachProfile: { select: { id: true } },
        athleteProfile: { select: { id: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const relationship = await this.prisma.coachAthleteRelationship.findFirst({
      where: {
        id: relationshipId,
        OR: [
          ...(user.coachProfile
            ? [{ coachProfileId: user.coachProfile.id }]
            : []),
          ...(user.athleteProfile
            ? [{ athleteProfileId: user.athleteProfile.id }]
            : []),
        ],
      },
    });
    if (!relationship) throw new NotFoundException('Relationship not found');

    return this.prisma.coachAthleteRelationship.update({
      where: { id: relationship.id },
      data: { status: CoachAthleteStatus.ARCHIVED },
    });
  }

  async getAthleteOverview(userId: string, athleteProfileId: string) {
    await this.requireActiveRelationship(userId, athleteProfileId);
    const athlete = await this.prisma.athleteProfile.findUnique({
      where: { id: athleteProfileId },
      select: {
        id: true,
        displayName: true,
        preferredWeightUnit: true,
        user: { select: { email: true } },
        workoutResults: {
          take: 10,
          orderBy: { performedAt: 'desc' },
          select: {
            id: true,
            performedAt: true,
            workout: { select: { id: true, name: true } },
            workoutVariant: {
              select: { level: { select: { key: true, name: true } } },
            },
            resultType: { select: { key: true, name: true } },
            timeSeconds: true,
            rounds: true,
            reps: true,
            load: true,
            weightUnit: true,
          },
        },
        scheduledWorkouts: {
          take: 30,
          orderBy: { scheduledDate: 'asc' },
          include: {
            workout: { select: { id: true, name: true } },
            workoutVariant: {
              select: { id: true, name: true, level: true },
            },
            workoutResult: { select: { id: true } },
          },
        },
      },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    return athlete;
  }

  async assignWorkout(
    userId: string,
    athleteProfileId: string,
    dto: AssignWorkoutDto,
  ) {
    const coach = await this.requireActiveRelationship(
      userId,
      athleteProfileId,
    );
    const variant = await this.prisma.workoutVariant.findFirst({
      where: { id: dto.workoutVariantId, workoutId: dto.workoutId },
      include: { workout: { select: { isActive: true } } },
    });
    if (!variant?.workout.isActive) {
      throw new NotFoundException('Active workout variation not found');
    }

    const prescription = dto.prescriptionCategoryKey
      ? await this.prisma.prescriptionCategory.findUnique({
          where: { key: dto.prescriptionCategoryKey },
        })
      : null;
    if (dto.prescriptionCategoryKey && !prescription) {
      throw new NotFoundException('Prescription category not found');
    }

    try {
      return await this.prisma.scheduledWorkout.create({
        data: {
          athleteProfileId,
          workoutId: dto.workoutId,
          workoutVariantId: dto.workoutVariantId,
          prescriptionCategoryId: prescription?.id,
          scheduledDate: new Date(`${dto.scheduledDate}T00:00:00.000Z`),
          assignedByCoachProfileId: coach.id,
          coachNotes: dto.coachNotes?.trim() || null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This workout variation is already scheduled for that date',
        );
      }
      throw error;
    }
  }

  async reviewAssignment(
    userId: string,
    scheduledWorkoutId: string,
    dto: ReviewAssignmentDto,
  ) {
    const coach = await this.getCoach(userId);
    const assignment = await this.prisma.scheduledWorkout.findFirst({
      where: {
        id: scheduledWorkoutId,
        assignedByCoachProfileId: coach.id,
        status: 'COMPLETED',
      },
    });
    if (!assignment)
      throw new NotFoundException('Completed assignment not found');

    return this.prisma.scheduledWorkout.update({
      where: { id: assignment.id },
      data: {
        coachFeedback: dto.feedback.trim(),
        reviewedAt: new Date(),
      },
    });
  }

  private async getCoach(userId: string) {
    const coach = await this.prisma.coachProfile.findUnique({
      where: { userId },
    });
    if (!coach) throw new ForbiddenException('Coach profile required');
    return coach;
  }

  private async getAthlete(userId: string) {
    const athlete = await this.prisma.athleteProfile.findUnique({
      where: { userId },
    });
    if (!athlete) throw new NotFoundException('Athlete profile not found');
    return athlete;
  }

  private async requireActiveRelationship(
    userId: string,
    athleteProfileId: string,
  ) {
    const coach = await this.getCoach(userId);
    const relationship = await this.prisma.coachAthleteRelationship.findFirst({
      where: {
        coachProfileId: coach.id,
        athleteProfileId,
        status: CoachAthleteStatus.ACTIVE,
      },
    });
    if (!relationship)
      throw new ForbiddenException('Active coach relationship required');
    return coach;
  }
}
