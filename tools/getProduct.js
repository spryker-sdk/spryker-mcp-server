// tools/getProduct.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const getProductHandler = async ({sku}) => {
    try {
        const response = await sprykerApi.get(`abstract-products/${sku}`, {});
        return formatSuccessResponse(response.data);
    } catch (error) {
        return formatErrorResponse(error, 'fetching product');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'getProduct',
        'Fetches product abstract details by SKU including name, description, price and related concrete products.',
        {
            sku: z.string().describe('Stock Keeping Unit of the abstract product'),
        },
        getProductHandler,
        false // Does not require authentication - product details are public
    );

    tool.registerTool(server);
}
