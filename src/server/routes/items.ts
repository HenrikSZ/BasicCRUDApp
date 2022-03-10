import { ICreateItem, ILikeItem, IUpdateItem } from "../../types/items"
import { ICreateDeletion } from "../models/DeletionModel.js"
import InventoryController, { IAccessItemParameters } from "../controllers/InventoryController.js"
import { FastifyInstance, FastifyPluginOptions } from "fastify"


const createItemBodySchema = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
        count: {
            type: "integer",
            minimum: 0
        }
    }
}


const itemAccessParamsSchema = {
    type: "object",
    properties: {
        item_id: {
            type: "integer",
            minimum: 1
        }
    }
}


const updateItemBodySchema = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
        count_change: {
            type: "integer"
        },
    }
}


const deleteItemBodySchema = {
    type: "object",
    properties: {
        comment: {
            type: "string",
            minLength: 1,
            maxLength: 255
        },
    }
}


const getItemLikemBodySchema = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
    }
}


export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
    const invContr = new InventoryController()

    fastify.get("/items", (req, rep) => invContr.getInventory(req, rep))
    fastify.get("/items/deleted",
        (req, rep) => invContr.getDeletedInventory(req, rep))
    fastify.get("/items/export",
        (req, rep) => invContr.exportInventoryAsCsv(req, rep))
    fastify.get("/items/deleted/export",
        (req, rep) => invContr.exportDeletedInventoryAsCsv(req, rep))

    fastify.post<{Body: ICreateItem}>(
        "/items/item/new", {
            handler: (req, rep) => invContr.postNewInventoryItem(req, rep),
            schema: {
                body: createItemBodySchema
            }
        }
    )

    fastify.get<{Params: IAccessItemParameters}>(
        "/items/item/existing/:item_id", {
            handler: (req, rep) => invContr.getInventoryItem(req, rep),
            schema: {
                params: itemAccessParamsSchema
            }
        }
    )
    fastify.put<{Params: IAccessItemParameters, Body: IUpdateItem}>(
        "/items/item/existing/:item_id", {
            handler: (req, rep) => invContr.updateInventoryItem(req, rep),
            schema: {
                params: itemAccessParamsSchema,
                body: updateItemBodySchema
            }
        }
    )
    fastify.put<{Params: IAccessItemParameters}>(
        "/items/item/deleted/:item_id", {
            handler: (req, rep) => invContr.restoreInventoryItem(req, rep),
            schema: {
                params: itemAccessParamsSchema
            }
        }
    )
    fastify.delete<{Params: IAccessItemParameters, Body: ICreateDeletion}>(
        "/items/item/existing/:item_id", {
            handler: (req, rep) => invContr.deleteInventoryItem(req, rep),
            schema: {
                params: itemAccessParamsSchema,
                body: deleteItemBodySchema
            }
        }
    )

    fastify.get<{Params: ILikeItem}>(
        "/items/item/like/:name", {
            handler: (req, rep) => invContr.getItemLike(req, rep),
            schema: {
                params: getItemLikemBodySchema
            }
        }
    )

    done()
}
