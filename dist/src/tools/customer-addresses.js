/**
 * Customer Address Book Tools
 *
 * Manage a registered customer's saved addresses: list, add, update, delete.
 */
import { z } from 'zod';
import { ApiError, SprykerApiService } from '../services/spryker-api.js';
import { logger } from '../utils/logger.js';
const AddressAttributesSchema = z.object({
    salutation: z.string().optional().describe('Salutation (Mr, Mrs, Ms)'),
    firstName: z.string().describe('First name'),
    lastName: z.string().describe('Last name'),
    address1: z.string().describe('Primary address line (street)'),
    address2: z.string().optional().describe('Secondary address line (house number)'),
    address3: z.string().optional().describe('Additional address line'),
    zipCode: z.string().describe('ZIP / postal code'),
    city: z.string().describe('City'),
    iso2Code: z.string().optional().describe('Country ISO2 code'),
    company: z.string().optional().describe('Company name'),
    phone: z.string().optional().describe('Phone number'),
    isDefaultShipping: z.boolean().optional().describe('Set as default shipping address'),
    isDefaultBilling: z.boolean().optional().describe('Set as default billing address'),
});
function errorResponse(action, error, extra = {}) {
    return {
        content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    error: `Failed to ${action}`,
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    responseData: error instanceof ApiError ? error.responseData : [],
                    ...extra,
                }, null, 2),
            }],
        isError: true,
    };
}
// --- Get addresses ---
const GetAddressesSchema = z.object({
    token: z.string().describe('Customer access token'),
    customerReference: z.string().describe('Customer reference the addresses belong to'),
});
async function getAddresses(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Retrieving customer addresses', { customerReference: args.customerReference });
        const response = await apiService.get(`customers/${args.customerReference}/addresses`, args.token);
        const data = response.data.data;
        const addresses = Array.isArray(data) ? data : data ? [data] : [];
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: response.status === 200,
                        message: 'Addresses retrieved successfully',
                        addresses: addresses.map(a => ({ id: a.id, attributes: a.attributes })),
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Get addresses failed', error);
        return errorResponse('retrieve addresses', error, { customerReference: args.customerReference });
    }
}
export const getAddressesTool = {
    name: 'get-addresses',
    description: 'List a registered customer\'s saved addresses.',
    inputSchema: z.toJSONSchema(GetAddressesSchema),
    handler: async (args) => getAddresses(GetAddressesSchema.parse(args)),
};
// --- Add address ---
const AddAddressSchema = z.object({
    token: z.string().describe('Customer access token'),
    customerReference: z.string().describe('Customer reference to add the address to'),
    address: AddressAttributesSchema.extend({
        iso2Code: z.string().default('DE').describe('Country ISO2 code'),
    }).describe('Address details'),
});
async function addAddress(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Adding customer address', { customerReference: args.customerReference });
        const response = await apiService.post(`customers/${args.customerReference}/addresses`, { data: { type: 'addresses', attributes: args.address } }, args.token);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Address added successfully',
                        address: response.data,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Add address failed', error);
        return errorResponse('add address', error, { customerReference: args.customerReference });
    }
}
export const addAddressTool = {
    name: 'add-address',
    description: 'Add a new address to a registered customer\'s address book.',
    inputSchema: z.toJSONSchema(AddAddressSchema),
    handler: async (args) => addAddress(AddAddressSchema.parse(args)),
};
// --- Update address ---
const UpdateAddressSchema = z.object({
    token: z.string().describe('Customer access token'),
    customerReference: z.string().describe('Customer reference the address belongs to'),
    addressId: z.string().describe('ID (uuid) of the address to update'),
    address: AddressAttributesSchema.partial().describe('Address fields to update'),
});
async function updateAddress(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Updating customer address', { customerReference: args.customerReference, addressId: args.addressId });
        const response = await apiService.patch(`customers/${args.customerReference}/addresses/${args.addressId}`, { data: { type: 'addresses', attributes: args.address } }, args.token);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Address updated successfully',
                        address: response.data,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Update address failed', error);
        return errorResponse('update address', error, { addressId: args.addressId });
    }
}
export const updateAddressTool = {
    name: 'update-address',
    description: 'Update an existing address in a registered customer\'s address book.',
    inputSchema: z.toJSONSchema(UpdateAddressSchema),
    handler: async (args) => updateAddress(UpdateAddressSchema.parse(args)),
};
// --- Delete address ---
const DeleteAddressSchema = z.object({
    token: z.string().describe('Customer access token'),
    customerReference: z.string().describe('Customer reference the address belongs to'),
    addressId: z.string().describe('ID (uuid) of the address to delete'),
});
async function deleteAddress(args) {
    const apiService = SprykerApiService.getInstance();
    try {
        logger.info('Deleting customer address', { customerReference: args.customerReference, addressId: args.addressId });
        await apiService.delete(`customers/${args.customerReference}/addresses/${args.addressId}`, args.token);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Address deleted successfully',
                        addressId: args.addressId,
                    }, null, 2),
                }],
        };
    }
    catch (error) {
        logger.error('Delete address failed', error);
        return errorResponse('delete address', error, { addressId: args.addressId });
    }
}
export const deleteAddressTool = {
    name: 'delete-address',
    description: 'Delete an address from a registered customer\'s address book.',
    inputSchema: z.toJSONSchema(DeleteAddressSchema),
    handler: async (args) => deleteAddress(DeleteAddressSchema.parse(args)),
};
//# sourceMappingURL=customer-addresses.js.map