// tools/addToCart.js
import {z} from 'zod';
import {BaseTool} from '../utils/baseTool.js';
import sprykerApi from '../services/sprykerApiService.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const addToCartHandler = async ({token, sku, quantity = 1}) => {
    try {
        // First, create a cart if one doesn't exist or get existing cart
        let cartResponse;
        try {
            // Try to get existing cart
            const cartsResponse = await sprykerApi.get('carts', {}, token);
            if (cartsResponse.data.data && cartsResponse.data.data.length > 0) {
                cartResponse = cartsResponse.data.data[0]; // Use first available cart
            } else {
                // Create new cart if none exists
                const newCartResponse = await sprykerApi.post('carts', {
                    data: {
                        type: 'carts',
                        attributes: {
                            priceMode: 'GROSS_MODE',
                            currency: 'EUR',
                            store: 'DE'
                        }
                    }
                }, token);
                cartResponse = newCartResponse.data.data;
            }
        } catch (error) {
            // If cart retrieval fails, try to create a new one
            const newCartResponse = await sprykerApi.post('carts', {
                data: {
                    type: 'carts',
                    attributes: {
                        priceMode: 'GROSS_MODE',
                        currency: 'EUR',
                        store: 'DE'
                    }
                }
            }, token);
            cartResponse = newCartResponse.data.data;
        }

        const cartId = cartResponse.id;

        // Add item to cart
        const response = await sprykerApi.post(
            `carts/${cartId}/items`,
            {
                data: {
                    type: 'items',
                    attributes: {
                        sku,
                        quantity
                    }
                }
            },
            token
        );

        return formatSuccessResponse({
            message: 'Item added to cart successfully',
            cart: response.data.data,
            cartId: cartId,
            addedItem: {
                sku,
                quantity
            }
        });
    } catch (error) {
        return formatErrorResponse(error, 'adding item to cart');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'addToCart',
        'Adds a product to the shopping cart for authenticated users',
        {
            sku: z.string().describe('Stock Keeping Unit (SKU) of the product to add to cart'),
            quantity: z.number().optional().default(1).describe('Quantity of the product to add (default: 1)'),
        },
        addToCartHandler,
        true // Requires authentication
    );

    tool.registerTool(server);
}
