import type { Session } from '$services/types';
import { sessionsKey } from '$services/keys';
import { client } from '$services/redis';
import { session } from '$app/stores';
import { genId } from '$services/utils';

export const getSession = async (id: string) => {
  const session = await client.hGetAll(sessionsKey(id))

  if (!Object.keys(session).length) return null

  return deserialize(id, session)
};

export const saveSession = async (session: Session) => {
  return client.hSet(sessionsKey(session.id), serialize(session))
};

const serialize = (session: Session) => {
  return {
    userId: session.userId,
    username: session.username,
  }
}

const deserialize = (id: string, session: { [key: string]: string }): Session => {
  return {
    id,
    userId: session.userId,
    username: session.username,
  }
}