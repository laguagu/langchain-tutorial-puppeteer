import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const zodSchema = z.object({
  foods: z
    .array(
      z.object({
        name: z.string().describe("The name of the food item"),
        healthy: z.boolean().describe("Whether the food is good for you"),
        color: z.string().optional().describe("The color of the food"),
      })
    )
    .describe("An array of food items mentioned in the text"),
});

const prompt1 = new ChatPromptTemplate({
  promptMessages: [
    SystemMessagePromptTemplate.fromTemplate(
      "List all food items mentioned in the following text."
    ),
    HumanMessagePromptTemplate.fromTemplate("{inputText}"),
  ],
  inputVariables: ["inputText"],
});

const llm1 = new ChatOpenAI({ model: "gpt-3.5-turbo-0613", temperature: 0 });
const llm2 = new ChatOpenAI({ model: "gpt-3.5-turbo-0613", temperature: 0 });

const functionCallingModel = llm1.bind({
  functions: [
    {
      name: "output_formatter",
      description: "Should always be used to properly format output",
      parameters: zodToJsonSchema(zodSchema),
    },
  ],
  function_call: { name: "output_formatter" },
});

// Vaihe 2. Määritellään toinen prompt
const prompt2 = PromptTemplate.fromTemplate("List all healty foods names mentioned in {foods}? Respond in {language}.");

// Binding "function_call" below makes the model always call the specified function.
// If you want to allow the model to call functions selectively, omit it.

const chain1 = RunnableSequence.from([prompt1, functionCallingModel, new JsonOutputFunctionsParser()]);
const chain2 = RunnableSequence.from([prompt2, llm2, new StringOutputParser()]);

const chain1Result = await chain1.invoke({
  inputText: "I like apples, bananas, oxygen, and french fries.",
});
console.log('chain1Result', chain1Result)
const foods = chain1Result.foods.map(food => food.name).join(', ');
console.log('foods', foods)
const language = "finnish";
const combinedChain = RunnableSequence.from([
  {
    foods: () => foods,
    language: () => language
  },
  chain2,
]);

const result = await combinedChain.invoke();

console.log(result);
/*
  {
    "output": {
      "foods": [
        {
          "name": "apples",
          "healthy": true,
          "color": "red"
        },
        {
          "name": "bananas",
          "healthy": true,
          "color": "yellow"
        },
        {
          "name": "french fries",
          "healthy": false,
          "color": "golden"
        }
      ]
    }
  }
*/
// const foodNames = response1.output.foods.map(food => food.name).join(", ");

// const response2 = await chain2.invoke({
//   foods: foodNames,  // Välitetään vain ruokien nimet
//   language: "finnish",
// });

// console.log('Formatted food names:', foodNames);
// console.log('Response from chain2:', response2);