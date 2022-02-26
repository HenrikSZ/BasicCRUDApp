import ShipmentController, { IAccessShipmentItemParameters, IAccessShipmentParameters } from "../controllers/ShipmentController.js"
import { FastifyInstance, FastifyPluginOptions } from "fastify"
import { ICreateShipment, IUpdateShipment, IUpdateShipmentItem } from "../models/ShipmentModel.js"


const createShipmentBodySchema = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
        source: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
        destination: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        minimum: 1
                    },
                    assigned_count: {
                        type: "integer"
                    }
                }
            }
        }
    }
}


const updateShipmentItemBodySchema = {
    type: "object",
    properties: {
        assigned_count: {
            type: "integer"
        }
    }
}


const updateShipmentBodySchema = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
        source: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
        destination: {
            type: "string",
            minLength: 1,
            maxLength: 64
        },
    }
}


const shipmentAccessParamsSchema = {
    type: "object",
    properties: {
        shipment_id: {
            type: "integer",
            minimum: 1
        }
    }
}


const shipmentItemAccessParamsSchema = {
    type: "object",
    properties: {
        shipment_id: {
            type: "integer",
            minimum: 1
        },
        item_id: {
            type: "integer",
            minimum: 1
        }
    }
}


export default function(fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
    const contr = new ShipmentController()

    fastify.get("/shipments", (req, rep) => contr.getAllShipments(req, rep))
    fastify.get("/shipments/export",
        (req, rep) => contr.exportShipmentsAsCsv(req, rep))

    fastify.put<{Body: ICreateShipment}>(
        "/shipments/shipment/new", {
            handler: (req, rep) => contr.createShipment(req, rep),
            schema: {
                body: createShipmentBodySchema
            }
        }
    )

    fastify.get<{Params: IAccessShipmentParameters}>(
        "/shipment/existing/:shipmentId", {
            handler: (req, rep) => contr.getShipment(req, rep),
            schema: {
                params: shipmentAccessParamsSchema
            }
        }
    )


    fastify.put<{Params: IAccessShipmentParameters, Body: IUpdateShipment}>(
        "/shipments/shipment/existing/:shipment_id", {
            handler: (req, rep) => contr.updateShipment(req, rep),
            schema: {
                params: shipmentAccessParamsSchema,
                body: updateShipmentBodySchema
            }
        }
    )
    fastify.delete<{Params: IAccessShipmentParameters}>(
        "/shipments/shipment/existing/:shipment_id", {
            handler: (req, rep) => contr.deleteShipment(req, rep),
            schema: {
                params: shipmentAccessParamsSchema
            }
        }
    )


    fastify.put<{Params: IAccessShipmentItemParameters, Body: IUpdateShipmentItem}>(
        "/shipment/existing/:shipment_id/:item_id", {
            handler: (req, rep) => contr.updateShipmentItem(req, rep),
            schema: {
                params: shipmentItemAccessParamsSchema,
                body: updateShipmentItemBodySchema
            }
        }
    )
    fastify.delete<{Params: IAccessShipmentItemParameters}>(
        "/shipments/shipment/existing/:shipment_id/:item_id", {
            handler: (req, rep) => contr.deleteShipmentItem(req, rep),
            schema: {
                params: shipmentItemAccessParamsSchema
            }
        }
    )

    done()
}
