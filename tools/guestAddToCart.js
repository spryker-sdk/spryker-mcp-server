// tools/guestAddToCart.js
import {z} from 'zod';
import sprykerApiService from '../services/sprykerApiService.js';
import {BaseTool} from '../utils/baseTool.js';
import {formatErrorResponse, formatSuccessResponse} from '../utils/responseFormatter.js';

const guestAddToCartHandler = async ({sku, quantity = 1, guestCustomerUniqueId}) => {
    try {
        // Generate guest ID if not provided
        const guestId = guestCustomerUniqueId || 'guest-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
        
        // Add item to guest cart using SprykerApiService with guest authentication
        const response = await sprykerApiService.post(
            'guest-cart-items',
            {
                data: {
                    type: 'guest-cart-items',
                    attributes: {
                        sku: sku,
                        quantity: quantity
                    }
                }
            },
            guestId // Pass guest ID as token
        );

        return formatSuccessResponse({
            cart: response.data.data,
            included: response.data.included,
            guest_customer_unique_id: guestId,
            message: `Added ${quantity} x ${sku} to guest cart`
        });
    } catch (error) {
        return formatErrorResponse(error, 'Failed to add item to guest cart');
    }
};

export default function registerTool(server) {
    const tool = new BaseTool(
        'guestAddToCart',
        'Adds a product to guest cart for anonymous checkout',
        {
            sku: z.string().describe('Product concrete SKU to add to cart'),
            quantity: z.number().optional().default(1).describe('Quantity to add (default: 1)'),
            guestCustomerUniqueId: z.string().optional().describe('Guest customer unique ID (will be generated if not provided)')
        },
        guestAddToCartHandler,
        false // Does not require authentication
    );

    tool.registerTool(server);
}
