const { zodToJsonSchema } = require("zod-to-json-schema");
const { z } = require("zod");
const { DynamicStructuredTool } = require("@langchain/core/tools");

const orderDetailsSchema = z.object({
    reference_id: z.string().describe(
        "Generate unique identifier for the order or invoice, provided by the business. It is case sensitive and cannot be an empty string and \
             can only contain English letters, numbers, underscores, dashes, or dots, and should not exceed 35 characters."
    ),
    total_amount: z.object({
        value: z.number().describe(
            "The total amount of the order or invoice. \
            total_amount.value must be equal to subtotal.value + tax.value + shipping.value - discount.value."
        ),
    }).describe("The total amount details for the order"),
    items: z
        .array(
            z.object({
                retailer_id: z.string().describe("Generate unique identifier for an item in the order."),
                name: z.string().describe("The item's name to be displayed to the user. Cannot exceed 60 characters"),
                amount: z.object({
                  value: z.number().describe("The price per item in the order."),
                }).describe("The amount details per item of the order"),
                sale_amount: z.object({
                  value: z.number().describe(
                    "The discounted price per item. This should be less than the original amount. \
                    If included, this field is used to calculate the subtotal amount"
                  ),
                }).optional().describe("The sale amount details for the item"),
                quantity: z.number().positive().int().describe("The number of this item in the order, this field cannot be decimal has to be integer."),
            })
        ).describe("The list of items for this order"),
    subtotal: z.object({
        value: z.number().describe(
            "The value must be equal to sum of (amount per item multiplied by quantity per item)"
        ),
    }).describe("The subtotal details for the order"),
    tax: z.object({
        value: z.number().describe(
            "The tax amount for the order."
        ),
        description: z.string().optional().describe(
            "The description of the tax. It cannot exceed 60 characters."
        ),
    }).optional().describe("The tax details for the order"),
    shipping: z.object({
        value: z.number().describe(
            "The shipping cost for the order."
        ),
        description: z.string().optional().describe(
            "The description of the shipping cost. It cannot exceed 60 characters."
        ),
    }).optional().describe("The shipping details for the order"),
    discount: z.object({
        value: z.number().describe(
            "The discount amount for the order."
        ),
        description: z.string().optional().describe(
            "The description of the discount. It cannot exceed 60 characters."
        ),
        discount_program_name: z.string().optional().describe(
            "Text used for defining incentivised orders. \
            If order is incentivised, define this information. Max character limit is 60 characters"
        ),
    }).optional().describe("The discount details for the order"),
}).describe("The order details for the order");

const orderDetailsOpenAIFunction = {
  name: "orderDetails",
  description: "Return the order details for the order.",
  parameters: zodToJsonSchema(orderDetailsSchema, "orderDetailsSchema"),
}

// Create an empty array to store tools
const tools = [];

// Create a new DynamicStructuredTool instance named "orderTool"  to retrieve order details
const orderTool = new DynamicStructuredTool({
  name: "generateOrderDetailsObject",
  description: "A tool to generate a node.js object. The object will have as properties, the order details. \
  The input is generated from the order details.",
  schema: orderDetailsSchema,
  func: async ({
        reference_id,
        total_amount: { value },
        items: items,
        subtotal: { value: subtotalValue },
        tax: { value: taxValue, description: taxDescription },
        shipping: { value: shippingValue, description: shippingDescription },
        discount: { value: discountValue, description: discountDescription, discount_program_name }
    }) => {
    return {
      reference_id: reference_id,
      total_amount: { value: value },
      items: items,
      subtotal: { value: subtotalValue },
      tax: { value: taxValue, description: taxDescription },
      shipping: { value: shippingValue, description: shippingDescription },
      discount: { value: discountValue, description: discountDescription, discount_program_name }
    }
  }
})


// Add the orderTool to the tools array
tools.push(orderTool);

module.exports = {
    orderDetailsSchema, orderDetailsOpenAIFunction, tools, orderTool
};




