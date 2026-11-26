import "server-only";

import { db } from "@/lib/db";
import { canViewPrivateProfile } from "@/lib/rbac";
import type { ConnectionStatus, Role, SessionUser } from "@/types";

const profileInclude = {
  skills: {
    include: {
      skill: true,
      endorsements: { include: { endorser: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  qualifications: { orderBy: { year: "desc" as const } },
  experiences: { orderBy: { startDate: "desc" as const } },
  projects: { orderBy: { createdAt: "desc" as const } },
  achievements: { orderBy: { createdAt: "desc" as const } },
  portfolioItems: { orderBy: { createdAt: "desc" as const } },
};

export async function getProfileForUser(userId: string) {
  return db.profile.findUnique({
    where: { userId },
    include: profileInclude,
  });
}

export async function getProfileById(id: string, viewer: SessionUser) {
  const profile = await db.profile.findUnique({
    where: { id },
    include: {
      ...profileInclude,
      user: { select: { id: true, name: true, role: true, email: true } },
    },
  });

  if (!profile) return null;

  const connected = await isConnected(viewer.id, profile.userId);

  if (profile.visibility !== "PUBLIC" && !canViewPrivateProfile(viewer, profile.userId, connected)) {
    return null;
  }

  const [connectionStatus, connection] = await Promise.all([
    getConnectionStatus(viewer.id, profile.userId),
    db.connection.findFirst({
      where: {
        OR: [
          { requesterId: viewer.id, addresseeId: profile.userId },
          { requesterId: profile.userId, addresseeId: viewer.id },
        ],
      },
      select: { id: true },
    }),
  ]);

  return {
    ...profile,
    connected,
    connectionStatus,
    connectionId: connection?.id,
  };
}

export async function getConnectionStatus(
  viewerId: string,
  otherId: string,
): Promise<ConnectionStatus> {
  if (viewerId === otherId) return "ACCEPTED";

  const connection = await db.connection.findFirst({
    where: {
      OR: [
        { requesterId: viewerId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: viewerId },
      ],
    },
  });

  if (!connection) return "NONE";
  if (connection.status === "ACCEPTED") return "ACCEPTED";
  if (connection.requesterId === viewerId) return "PENDING_SENT";
  return "PENDING_RECEIVED";
}

export async function isConnected(userId: string, otherId: string) {
  return (await getConnectionStatus(userId, otherId)) === "ACCEPTED";
}

export async function getConnectionMap(viewerId: string) {
  const connections = await db.connection.findMany({
    where: { OR: [{ requesterId: viewerId }, { addresseeId: viewerId }] },
  });

  const map = new Map<string, ConnectionStatus>();

  for (const connection of connections) {
    if (connection.status === "ACCEPTED") {
      map.set(
        connection.requesterId === viewerId ? connection.addresseeId : connection.requesterId,
        "ACCEPTED",
      );
    } else if (connection.requesterId === viewerId) {
      map.set(connection.addresseeId, "PENDING_SENT");
    } else {
      map.set(connection.requesterId, "PENDING_RECEIVED");
    }
  }

  return map;
}

export async function listPeople(input: {
  viewer: SessionUser;
  q?: string;
  role?: Role;
  skill?: string;
}) {
  const users = await db.user.findMany({
    where: {
      id: { not: input.viewer.id },
      ...(input.role ? { role: input.role } : {}),
      profile: {
        visibility: "PUBLIC",
        ...(input.q
          ? {
              OR: [
                { name: { contains: input.q } },
                { headline: { contains: input.q } },
                { bio: { contains: input.q } },
                { location: { contains: input.q } },
              ],
            }
          : {}),
        ...(input.skill
          ? { skills: { some: { skill: { name: { contains: input.skill } } } } }
          : {}),
      },
    },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
        },
      },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  const connectionMap = await getConnectionMap(input.viewer.id);

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role as Role,
    profile: user.profile,
    connectionStatus: connectionMap.get(user.id) ?? "NONE",
  }));
}

export async function listConnections(userId: string) {
  const connections = await db.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: {
        include: { profile: { select: { id: true, name: true, headline: true, avatarUrl: true } } },
      },
      addressee: {
        include: { profile: { select: { id: true, name: true, headline: true, avatarUrl: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return connections.map((connection) => {
    const other = connection.requesterId === userId ? connection.addressee : connection.requester;
    return {
      id: connection.id,
      userId: other.id,
      name: other.profile?.name ?? other.name,
      headline: other.profile?.headline,
      avatarUrl: other.profile?.avatarUrl,
      profileId: other.profile?.id,
      connectedAt: connection.updatedAt,
    };
  });
}

export async function listPendingConnections(userId: string) {
  return db.connection.findMany({
    where: { addresseeId: userId, status: "PENDING" },
    include: {
      requester: {
        include: { profile: { select: { id: true, name: true, headline: true, avatarUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSkills() {
  return db.skill.findMany({ orderBy: { name: "asc" } });
}
