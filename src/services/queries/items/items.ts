import type { CreateItemAttrs } from '$services/types';
import { client } from '$services/redis';
import { serialize } from './serialize';
import { genId } from '$services/utils';
import { itemsKey, itemsByViewsKey, itemsByEndingAtKey } from '$services/keys';
import { deserialize } from './deserialize';

export const getItem = async (id: string) => {
  const item = await client.hGetAll(itemsKey(id))

  if (!Object.keys(item).length) return null

  return deserialize(id, item)
};

export const getItems = async (ids: string[]) => {
  const commands = ids.map(id => client.hGetAll(itemsKey(id)))
  const results = await Promise.all(commands)

  return results.map((result, i) => {
    if (!Object.keys(result).length) return null
    return deserialize(ids[i], result)
  })
};

export const createItem = async (attrs: CreateItemAttrs, userId: string) => {
  const id = genId()
  const serialized = serialize(attrs)

  await Promise.all([
    client.hSet(itemsKey(id), serialized),
    client.zAdd(itemsByViewsKey(), {
      value: id,
      score: 0,
    }),
    client.zAdd(itemsByEndingAtKey(), {
      value: id,
      score: serialized.endingAt,
    })
  ])

  return id
};
