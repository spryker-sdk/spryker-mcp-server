// services/sprykerApiService.js
import axios from 'axios';

/**
 * SprykerApiService - Handles API communication with Spryker e-commerce platform
 * 
 * Supports two authentication modes:
 * 1. Authenticated users: Uses Bearer token in Authorization header
 * 2. Guest users: Uses X-Anonymous-Customer-Unique-Id header
 * 
 * Guest tokens are identified by the 'guest-' prefix
 */
export class SprykerApiService {
    constructor() {
        this.baseUrl = process.env.SPRYKER_API_BASE_URL;
    }

    getHeaders(token) {
        let headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'access-control-allow-origin': '*',
            'content-language': 'en_US',
        };

        // Handle guest users with X-Anonymous-Customer-Unique-Id header
        if (token && token.startsWith('guest-')) {
            headers['X-Anonymous-Customer-Unique-Id'] = token;
        }
        // Handle authenticated users with Bearer token
        else if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }

    async get(endpoint, params = {}, token) {
        return axios.get(`${this.baseUrl}/${endpoint}`, {
            params,
            headers: this.getHeaders(token),
        });
    }

    async post(endpoint, data, token) {
        return axios.post(`${this.baseUrl}/${endpoint}`, data, {
            headers: this.getHeaders(token),
        });
    }

    async delete(endpoint, token) {
        return axios.delete(`${this.baseUrl}/${endpoint}`, {
            headers: this.getHeaders(token),
        });
    }

    async patch(endpoint, data, token) {
        return axios.patch(`${this.baseUrl}/${endpoint}`, data, {
            headers: this.getHeaders(token),
        });
    }
}

export default new SprykerApiService();
