const { zodToJsonSchema } = require("zod-to-json-schema");
const { z } = require("zod");
const { DynamicStructuredTool } = require("@langchain/core/tools");

// const orderDetailsSchema = z.object({
//     reference_id: z.string().describe(
//         "Generate unique identifier for the order or invoice, provided by the business. It is case sensitive and cannot be an empty string and \
//              can only contain English letters, numbers, underscores, dashes, or dots, and should not exceed 35 characters."
//     ),
//     total_amount: z.object({
//         offset: z.number().describe("Must be 100"),
//         value: z.number().positive().int().describe(
//             "The total amount of the order or invoice multiplied by 100. It should be a positive integer. \
//             total_amount.value must be equal to subtotal.value + tax.value + shipping.value - discount.value."
//         ),
//     }).describe("The total amount details for the order"),
//     items: z
//         .array(
//             z.object({
//                 retailer_id: z.string().describe("Generate unique identifier for an item in the order."),
//                 name: z.string().describe("The item's name to be displayed to the user. Cannot exceed 60 characters"),
//                 amount: z.object({
//                   offset: z.number().describe("Must be 100"),
//                   value: z.number().positive().int().describe("The price per item in the order multiplied by 100. It should be a positive integer."),
//                 }).describe("The amount details per item of the order"),
//                 sale_amount: z.object({
//                   offset: z.number().describe("Must be 100"),
//                   value: z.number().positive().int().describe(
//                     "The discounted price per item multiplied by 100. This should be less than the original amount. \
//                     If included, this field is used to calculate the subtotal amount"
//                   ),
//                 }).optional().describe("The sale amount details for the item"),
//                 quantity: z.number().positive().int().describe("The number of this item in the order, this field cannot be decimal has to be integer."),
//             })
//         ).describe("The list of items for this order"),
//     subtotal: z.object({
//         offset: z.number().describe("Must be 100"),
//         value: z.number().positive().int().describe(
//             "The value must be equal to sum of (amount per item multiplied by quantity per item) multiplied by 100. \
//             It should be a positive integer."
//         ),
//     }).describe("The subtotal details for the order"),
//     tax: z.object({
//         offset: z.number().describe("Must be 100"),
//         value: z.number().positive().int().describe(
//             "The tax amount for the order multiplied by 100. It should be a positive integer."
//         ),
//         description: z.string().optional().describe(
//             "The description of the tax. It cannot exceed 60 characters."
//         ),
//     }).describe("The tax details for the order"),
//     shipping: z.object({
//         offset: z.number().describe("Must be 100"),
//         value: z.number().positive().int().describe(
//             "The shipping cost for the order multiplied by 100. It should be a positive integer."
//         ),
//         description: z.string().optional().describe(
//             "The description of the shipping cost. It cannot exceed 60 characters."
//         ),
//     }).describe("The shipping details for the order"),
//     discount: z.object({
//         offset: z.number().describe("Must be 100"),
//         value: z.number().positive().int().describe(
//             "The discount amount for the order multiplied by 100. It should be a positive integer."
//         ),
//         description: z.string().optional().describe(
//             "The description of the discount. It cannot exceed 60 characters."
//         ),
//         discount_program_name: z.string().optional().describe(
//             "Text used for defining incentivised orders. \
//             If order is incentivised, define this information. Max character limit is 60 characters"
//         ),
//     }).describe("The discount details for the order"),
// }).describe("The order details for the order");

// const orderDetailsOpenAIFunction = {
//   name: "orderDetails",
//   description: "Return the order details for the order.",
//   parameters: zodToJsonSchema(orderDetailsSchema, "orderDetailsSchema"),
// }

// // Create an empty array to store tools
// const tools = [];

// // Create a new DynamicStructuredTool instance named "orderTool"  to retrieve order details
// const orderTool = new DynamicStructuredTool({
//   name: "getOrderDetails",
//   description: "Returns the order details.",
//   schema: orderDetailsSchema,
//   func: async ({
//         reference_id,
//         total_amount: { offset, value },
//         items: [],
//         subtotal: { offset: subtotalOffset, value: subtotalValue },
//         tax: { offset: taxOffset, value: taxValue, description: taxDescription },
//         shipping: { offset: shippingOffset, value: shippingValue, description: shippingDescription },
//         discount: { offset: discountOffset, value: discountValue, description: discountDescription, discount_program_name }
//     }) => {
//     return {
//       reference_id: reference_id,
//       total_amount: { offset: offset, value: value },
//       items: [],
//       subtotal: { offset: subtotalOffset, value: subtotalValue },
//       tax: { offset: taxOffset, value: taxValue, description: taxDescription },
//       shipping: { offset: shippingOffset, value: shippingValue, description: shippingDescription },
//       discount: { offset: discountOffset, value: discountValue, description: discountDescription, discount_program_name }
//     }
//   }
// })

const orderDetailsSchema = z.object({
    low: z.number().describe("The lower bound of the generated number"),
    high: z.number().describe("The upper bound of the generated number"),
  })

  const orderDetailsOpenAIFunction = {
      name: "randomNumberGenerator",
      description: "generate a random number between two input numbers",
      parameters: zodToJsonSchema(orderDetailsSchema, "orderDetailsSchema"),
    }



const orderTool = new DynamicStructuredTool({
    name: "random-number-generator",
    description: "generates a random number between two input numbers",
    schema: orderDetailsSchema,
    func: async ({ low, high }) =>
      (Math.random() * (high - low) + low).toString(), // Outputs still must be strings
  })

const tools = [];

// Add the orderTool to the tools array
tools.push(orderTool);

module.exports = {
    orderDetailsSchema, orderDetailsOpenAIFunction, tools, orderTool
};



