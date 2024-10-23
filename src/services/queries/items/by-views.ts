import { itemsByViewsKey, itemsKey } from "$services/keys";
import { client } from "$services/redis";
import { Item } from "$services/types";
import { deserialize } from "./deserialize";

export const itemsByViews = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
  let results = await client.sort(
    itemsByViewsKey(),
    {
      GET: [
        '#',
        `${itemsKey('*')}->name`,
        `${itemsKey('*')}->views`,
        `${itemsKey('*')}->endingAt`,
        `${itemsKey('*')}->imageUrl`,
        `${itemsKey('*')}->price`,
      ],
      BY: 'nosort',
      DIRECTION: order,
      LIMIT: {
        offset,
        count,
      }
    }
  ) as string[]

  const items: Item[] = []
  while (results.length) {
    const [id, name, views, endingAt, imageUrl, price, ...rest] = results
    const item = deserialize(id, { name, views, endingAt, imageUrl, price })
    items.push(item)
    results = rest
  }

  return items
};
