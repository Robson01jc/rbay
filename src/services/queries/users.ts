import type { CreateUserAttrs, User } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { usernamesUniqueKey, usersKey } from '$services/keys';

export const getUserByUsername = async (username: string) => { };

export const getUserById = async (id: string) => {
  const user = await client.hGetAll(usersKey(id))

  return deserialize(id, user)
};

export const createUser = async (attrs: CreateUserAttrs) => {
  const id = genId()

  const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username)
  if (exists) throw new Error('Username is taken')

  await Promise.all([
    client.hSet(usersKey(id), serialize(attrs)),
    client.sAdd(usernamesUniqueKey(), attrs.username),
  ])

  return id
};

const serialize = (user: CreateUserAttrs) => {
  return {
    username: user.username,
    password: user.password,
  }
}

const deserialize = (id: string, user: { [key: string]: string }): User => {
  return {
    id,
    username: user.username,
    password: user.password,
  }
}