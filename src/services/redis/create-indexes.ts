import { itemsIndexKey, itemsKey } from "$services/keys";
import { SchemaFieldTypes } from "redis";
import { client } from "./client";

export const createIndexes = async () => {
  client.ft.create(
    itemsIndexKey(),
    {
      name: {
        type: SchemaFieldTypes.TEXT
      },
      description: {
        type: SchemaFieldTypes.TEXT
      }
    },
    {
      ON: 'HASH',
      PREFIX: itemsKey('')
    }
  )
};
