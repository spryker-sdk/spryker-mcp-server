# Spryker MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with Spryker e-commerce platform APIs. This server enables AI assistants to interact with Spryker's e-commerce functionality through standardized MCP tools.

## ⚠️ DEMO PREVIEW DISCLAIMER

**This is a demo preview repository showcasing the capabilities of Spryker with Model Context Protocol (MCP).**

This repository is intended for:
- **Demonstration purposes only**
- **Showcasing Spryker-MCP integration capabilities**
- **Development and testing environments**
- **Educational and evaluation purposes**

**Do not use this in production environments.** This demo version may contain:
- Simplified security implementations
- Incomplete error handling for production scenarios
- Development-focused configurations
- Limited scalability optimizations

For production implementations, please consult with Spryker's professional services team for proper enterprise-grade solutions.

## 🚀 Features

### Core Capabilities
#### Product Discovery & Search
- Natural language product search ("Find me wireless headphones under $200")
- Intelligent filtering, sorting, comparison and recommendations
- Real-time inventory and pricing information
#### Shopping Cart Management
- Add/remove items with conversational commands
- Cart optimization suggestions
- Support for both guest and authenticated customers
#### Checkout & Orders
- AI-guided checkout assistance
- Payment and shipping option recommendations  
- Order tracking and history access for authenticated customers
- Support for both guest and authenticated customers
#### Customer Experience
- Customer authentication
- Guest customers supported

### Technical Excellence
- **Multiple Transport Support**: stdio, HTTP, and SSE transports for flexible integration
- **TypeScript**: Full type safety with strict compilation settings
- **Modern Architecture**: Clean separation of concerns with dependency injection
- **Robust Error Handling**: Error tracking and recovery
- **Structured Logging**: JSON-based logging with multiple levels and metadata
- **Configuration Management**: Environment-based configuration with validation
- **API Resilience**: Retry logic, timeouts, and graceful degradation
- **Testing**: Unit and integration test coverage

## 📋 Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Spryker API**: Access to a Spryker Commerce OS API endpoint

## 🛠️ Installation & Usage

### Option 1: NPX (Recommended)
Run directly without installation:
```bash
npx @spryker-sdk/spryker-mcp-server
```

### Option 2: Global Installation
Install globally and run:
```bash
npm install -g @spryker-sdk/spryker-mcp-server
spryker-mcp-server
```

### Option 3: Local Installation
Install in your project:
```bash
npm install @spryker-sdk/spryker-mcp-server
npx spryker-mcp-server
```

### Option 4: Development Setup
Clone and build from source:
```bash
git clone https://github.com/spryker-sdk/spryker-mcp-server.git
cd spryker-mcp-server
npm install
npm run build
npm start
```

## ⚙️ Configuration

The server uses environment variables for configuration. Create a `.env` file or set these variables:

### Required Variables
```bash
# Spryker API Configuration
SPRYKER_API_BASE_URL=https://your-spryker-api.com
SPRYKER_API_TIMEOUT=30000
SPRYKER_API_RETRY_ATTEMPTS=3
SPRYKER_API_RETRY_DELAY=1000

# Server Configuration
MCP_SERVER_NAME=spryker-mcp-server
MCP_SERVER_VERSION=1.0.0

# Logging Configuration (optional)
LOG_LEVEL=info
LOG_FORMAT=json

# MCP Transport Configuration (optional)
MCP_TRANSPORT=stdio                 # Transport type: stdio, http, or sse
MCP_HTTP_PORT=3000                 # HTTP port for http/sse transport
MCP_HTTP_HOST=localhost            # HTTP host for http/sse transport  
MCP_HTTP_ENDPOINT=/mcp             # HTTP endpoint path
```

### Configuration Schema
All configuration is validated using Zod schemas:

- `SPRYKER_API_BASE_URL`: Valid HTTPS URL to Spryker Storefront API
- `SPRYKER_API_TIMEOUT`: Request timeout in milliseconds (default: 30000)
- `SPRYKER_API_RETRY_ATTEMPTS`: Number of retry attempts (default: 3)
- `SPRYKER_API_RETRY_DELAY`: Delay between retries in milliseconds (default: 1000)

### Business model

The server exposes a different set of tools depending on the configured business model. Spryker spans B2C, B2B, and Marketplace, where marketplace is a capability that overlays either B2C or B2B.

- `SPRYKER_BUSINESS_MODEL`: `b2c` (default) or `b2b`. Selects which model-specific tools are exposed (for example, B2C wishlists vs. B2B shopping lists and company tools).
- `SPRYKER_MARKETPLACE_ENABLED`: `true` / `false` (default `false`). When enabled, marketplace tools (merchants, product offers) are added on top of the selected model.

Tools without a model restriction (catalog search, cart, checkout, orders, customer account) are always available. The server logs how many tools are exposed vs. hidden at startup. Examples:

```bash
# B2C storefront (default)
SPRYKER_BUSINESS_MODEL=b2c

# B2B storefront
SPRYKER_BUSINESS_MODEL=b2b

# B2B marketplace
SPRYKER_BUSINESS_MODEL=b2b
SPRYKER_MARKETPLACE_ENABLED=true
```

## 🚀 Usage

### Transport Options

The server supports three transport modes:

#### 1. stdio Transport (Default)
Traditional standard input/output communication for MCP clients:
```bash
# Using npm scripts
npm run start:stdio

# Using the binary directly
npx spryker-mcp-server --transport stdio
```

#### 2. HTTP Transport  
HTTP-based communication with SSE for real-time updates:
```bash
# Using npm scripts
npm run start:http

# Using the binary directly
npx spryker-mcp-server --transport http --port 3000 --host localhost

# Access endpoints:
# Health check: http://localhost:3000/health
# MCP endpoint: http://localhost:3000/mcp
```

#### 3. SSE Transport
Server-Sent Events for real-time web applications:
```bash
# Using npm scripts  
npm run start:sse

# Using the binary directly
npx spryker-mcp-server --transport sse --port 3000 --host localhost --endpoint /mcp
```

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 🛡️ MCP Integration

### Claude Desktop Configuration (stdio transport)
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spryker": {
      "command": "npx",
      "args": ["spryker-mcp-server"],
      "env": {
        "SPRYKER_API_BASE_URL": "https://your-spryker-api.com"
      }
    }
  }
}
```

See [Claude Desktop MCP Integration](https://modelcontextprotocol.io/quickstart/user) for more details on MCP integration with Claude Desktop.

### HTTP/SSE Transport Integration
For web applications using HTTP or SSE transport:

```javascript
// HTTP client example
const response = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  })
});

// SSE client example
const eventSource = new EventSource('http://localhost:3000/mcp');
eventSource.onmessage = function(event) {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### VS Code MCP Extension
Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "spryker": {
      "command": "npx",
      "args": ["spryker-mcp-server"]
    }
  }
}
```

See [VS Code MCP Extension](https://aka.ms/vscode-add-mcp) for more details on MCP integration with VS Code.

## 🔧 Available Tools

The server provides 41 MCP tools for e-commerce operations. Which tools are exposed depends on the configured [business model](#business-model): common tools below are always available, while B2C, B2B, and Marketplace tools are gated by `SPRYKER_BUSINESS_MODEL` / `SPRYKER_MARKETPLACE_ENABLED`.

### Product Management
- **Product Search** (`product-search`) - Advanced product catalog search with filtering
- **Search Suggestions** (`search-suggestions`) - Autocomplete suggestions for a partial query
- **Product Details** (`get-product`) - Detailed abstract product info, including its concrete variants
- **Concrete Product** (`get-concrete-product`) - Detailed concrete product (variant) info by SKU
- **Product Availability** (`get-product-availability`) - Stock for an abstract or concrete product
- **Product Prices** (`get-product-prices`) - Prices (incl. volume prices) for an abstract or concrete product
- **Product Reviews** (`get-product-reviews`) - Customer reviews and ratings

### Catalog Navigation
- **Category Tree** (`get-category-tree`) - Full category tree for browsing
- **Category** (`get-category`) - Category node by ID

### Authentication & User Management
- **Authentication** (`authenticate`) - Customer login and guest session creation
- **Register Customer** (`register-customer`) - Create a customer account
- **Refresh Token** (`refresh-token`) - Exchange a refresh token for a new access token
- **Get Addresses** (`get-addresses`) - List a customer's saved addresses
- **Add Address** (`add-address`) - Add an address to the address book
- **Update Address** (`update-address`) - Update a saved address
- **Delete Address** (`delete-address`) - Delete a saved address

### Shopping Cart Operations
- **Add to Cart** (`add-to-cart`) - Add products to authenticated customer carts
- **Guest Add to Cart** (`guest-add-to-cart`) - Add products to guest user carts
- **Get Cart** (`get-cart`) - Retrieve cart contents and totals
- **Remove from Cart** (`remove-from-cart`) - Remove items from carts
- **Update Cart Item** (`update-cart-item`) - Modify cart item quantities
- **Add Cart Voucher** (`add-cart-voucher`) - Apply a discount/voucher code (registered or guest cart)
- **Remove Cart Voucher** (`remove-cart-voucher`) - Remove a discount/voucher code

### Wishlists (B2C only)
- **Get Wishlists** (`get-wishlists`) - List wishlists, or one wishlist with its items
- **Create Wishlist** (`create-wishlist`) - Create a new wishlist
- **Add to Wishlist** (`add-to-wishlist`) - Add a concrete product to a wishlist
- **Wishlist to Cart** (`wishlist-to-cart`) - Move all wishlist items into a cart

### Order Processing & Checkout
- **Get Checkout Data** (`get-checkout-data`) - Retrieve payment methods and shipping options
- **Checkout** (`checkout`) - Process complete order checkout with payment and shipping
- **Get Order** (`get-order`) - Retrieve order details and history

### B2B — Company & Users (B2B only)
- **Get Company Users** (`get-company-users`) - List company users for the authenticated customer
- **Get Business Units** (`get-business-units`) - List company business units
- **Get Company Roles** (`get-company-roles`) - List company roles
- **Get Company** (`get-company`) - Get company details by ID

### B2B — Shopping Lists (B2B only)
- **Get Shopping Lists** (`get-shopping-lists`) - List shopping lists, or one with its items
- **Create Shopping List** (`create-shopping-list`) - Create a new shopping list
- **Add to Shopping List** (`add-to-shopping-list`) - Add a concrete product to a shopping list
- **Shopping List to Cart** (`shopping-list-to-cart`) - Move all shopping list items into a cart

### Marketplace — Merchants & Offers (requires marketplace enabled)
- **Get Merchants** (`get-merchants`) - List marketplace merchants
- **Get Merchant** (`get-merchant`) - Get a merchant by reference, including profile
- **Get Product Offers** (`get-product-offers`) - List seller offers for a concrete product SKU

### Product Search (`product-search`)
Search for products with advanced filtering capabilities.

**Parameters:**
- `q` (string, optional): Search query text
- `rangeFacets` (array, optional): Range facet values for filtering (e.g., price ranges). Each object contains:
  - `name` (string, required): Range facet name
  - `min` (number, optional): Minimum value
  - `max` (number, optional): Maximum value
- `valueFacets` (array, optional): Exact value facet filters (e.g., brands, labels). Each object contains:
  - `name` (string, required): Facet name
  - `value` (string, required): Facet value
- `sort` (string, optional): Sort parameter name for ordering results
- `ipp` (number, default: 20): Items per page (1-100)
- `page` (number, default: 0): Page offset for pagination (0-based)

**Example:**
```json
{
  "q": "laptop",
  "rangeFacets": [
    {
      "name": "price",
      "min": 500,
      "max": 2000
    }
  ],
  "ipp": 10,
  "page": 0
}
```

### Authentication (`authenticate`)
Authenticate customers and obtain access tokens, or create guest sessions.

**Parameters:**
- `username` (string, optional): Customer username or email
- `password` (string, optional): Customer password

**Note:** If username and password are not provided, a guest session token will be generated for anonymous shopping.

### Product Details (`get-product`)
Retrieve detailed information about a specific product.

**Parameters:**
- `sku` (string, required): Product SKU

### Add to Cart (`add-to-cart`)
Add products to a customer's shopping cart.

**Parameters:**
- `customerToken` (string, required): Customer access token
- `sku` (string, required): Product SKU
- `quantity` (number, default: 1): Quantity to add

### Guest Add to Cart (`guest-add-to-cart`)
Add products to cart for non-authenticated users.

**Parameters:**
- `token` (string, required): Guest session token
- `sku` (string, required): Product SKU
- `quantity` (number, default: 1): Quantity to add

### Get Cart (`get-cart`)
Retrieve current cart contents and totals.

**Parameters:**
- `token` (string, required): Customer access token or guest token

### Remove from Cart (`remove-from-cart`)
Remove an item from the shopping cart.

**Parameters:**
- `token` (string, required): Customer access token or guest token
- `cartId` (string, required): ID of the cart containing the item
- `itemId` (string, required): ID of the item to remove

### Update Cart Item (`update-cart-item`)
Update the quantity of an item in the shopping cart.

**Parameters:**
- `token` (string, required): Customer access token or guest token
- `cartId` (string, required): ID of the cart containing the item
- `itemId` (string, required): ID of the item to update
- `quantity` (number, required): New quantity for the item

### Get Checkout Data (`get-checkout-data`)
Get checkout data including payment methods, shipment methods, and customer addresses.

**Parameters:**
- `token` (string, required): Customer access token or guest token
- `cartId` (string, required): ID of the cart to get checkout data for

### Checkout (`checkout`)
Process order checkout with payment and shipping.

**Parameters:**
- `token` (string, required): Customer access token or guest token
- `cartId` (string, required): Cart ID to checkout
- `customerData` (object, required): Customer information:
  - `email` (string, required): Customer email address
  - `firstName` (string, required): Customer first name
  - `lastName` (string, required): Customer last name
  - `salutation` (string, optional): Customer salutation (Mr, Mrs, Ms)
- `billingAddress` (object, required): Billing address:
  - `firstName` (string, required): First name
  - `lastName` (string, required): Last name
  - `address1` (string, required): Primary address line
  - `address2` (string, required): Secondary address line
  - `zipCode` (string, required): ZIP/Postal code
  - `city` (string, required): City
  - `salutation` (string, optional): Salutation
  - `country` (string, optional): Country ISO2 code (default: DE)
  - `company` (string, optional): Company name
  - `phone` (string, optional): Phone number
- `shippingAddress` (object, required): Shipping address with same structure as billing address
- `paymentMethod` (object, required): Payment method information:
  - `provider` (string, optional): Payment provider name (default: DummyPayment)
  - `method` (string, optional): Payment method (default: invoice)
- `shipmentMethod` (object, required): Shipment method:
  - `id` (number, required): Shipment method ID

### Get Order (`get-order`)
Retrieve order details and history.

**Parameters:**
- `token` (string, required): Customer access token
- `orderReference` (string, optional): Specific order reference to retrieve. If not provided, returns all orders

## 🎯 Available Prompts

The server includes 5 prompts that provide context-aware guidance for different e-commerce scenarios. Each prompt is designed to help AI assistants understand how to effectively use the available tools.

### Product Search (`product-search`)
Guides users through product discovery and search operations.

**Parameters:**
- `query` (string, optional): Product search query
- `category` (string, optional): Specific product category
- `price_range` (string, optional): Price range in format "min-max"
- `brand` (string, optional): Specific brand to filter by

### Cart Management (`cart-management`)
Assists with shopping cart operations and checkout guidance.

**Parameters:**
- `action` (string, required): Cart action - add, remove, view, update, or checkout
- `product_sku` (string, optional): Product SKU for add/remove operations
- `quantity` (number, optional): Quantity for add/update operations
- `customer_type` (string, optional): Customer type - authenticated or guest

### Customer Service (`customer-service`)
Provides support for customer authentication and account issues.

**Parameters:**
- `support_type` (string, required): Type of support needed - login, order_status, account_info, or general
- `username` (string, optional): Customer username or email for authentication
- `order_reference` (string, optional): Order reference number for order inquiries

### Order Fulfillment (`order-fulfillment`)
Guides through the complete order process from cart to completion.

**Parameters:**
- `customer_token` (string, optional): Customer authentication token
- `billing_address` (object, optional): Billing address information
- `shipping_address` (object, optional): Shipping address information
- `payment_method` (string, optional): Selected payment method

### Product Recommendations (`product-recommendations`)
Generates personalized product recommendations based on preferences.

**Parameters:**
- `customer_token` (string, optional): Customer authentication token
- `category_preference` (string, optional): Preferred product categories
- `price_range` (string, optional): Preferred price range
- `occasion` (string, optional): Special occasion or context
- `recently_viewed` (string, optional): Recently viewed products

### Using Prompts
Prompts are automatically available through the MCP protocol and provide context-aware guidance that helps AI assistants:

1. **Understand context**: Each prompt provides specific guidance for different e-commerce scenarios
2. **Use tools effectively**: Prompts explain which tools to use and how to combine them
3. **Handle edge cases**: Include guidance for error handling and alternative approaches
4. **Provide better UX**: Structured templates ensure consistent, helpful responses

## 🏗️ Architecture

### Project Structure
```
src/
├── config/           # Configuration management
├── services/         # External service integrations
├── tools/           # MCP tool implementations
├── utils/           # Shared utilities
└── index.ts         # Main server entry point
```

### Key Components

#### Configuration (`src/config/`)
- Environment variable validation with Zod
- Type-safe configuration objects
- Default value management

#### Services (`src/services/`)
- `SprykerApiService`: HTTP client with retry logic and error handling
- Request/response transformation
- Authentication management

#### Tools (`src/tools/`)
- Individual tool implementations
- Centralized tool registry
- Input validation with Zod schemas

#### Utilities (`src/utils/`)
- Structured logging with metadata support
- Environment validation
- Error handling utilities

## 🧪 Development

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Testing
npm test
npm run test:watch
npm run test:coverage
```

### Build Process
```bash
# Development build with watch
npm run dev

# Production build
npm run build

# Clean build artifacts
npm run clean
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Make your changes following the coding standards
5. Add tests for new functionality
6. Run the test suite: `npm test`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Coding Standards
- TypeScript with strict type checking
- ESLint configuration with recommended rules
- Conventional commit messages
- JSDoc documentation
- Good test coverage for core functionality (current: ~94%)

## 📚 API Reference

### Spryker API Compatibility
This server is compatible with Spryker Commerce OS Glue API:
- API Version: Latest stable version
- Authentication: Bearer tokens
- Response Format: JSON:API specification

### Error Handling
All tools return standardized error responses:
```json
{
  "content": [{
    "type": "text",
    "text": "Error: Detailed error message with context"
  }]
}
```

## 📖 Changelog

### Version 0.2.0 (Current)
- ✅ Business-model-aware tool exposure: `SPRYKER_BUSINESS_MODEL` (b2c|b2b) + `SPRYKER_MARKETPLACE_ENABLED` limit which tools are exposed
- ✅ Expanded coverage from 30 to 41 tools:
  - B2B — company & users: `get-company-users`, `get-business-units`, `get-company-roles`, `get-company`
  - B2B — shopping lists: `get-shopping-lists`, `create-shopping-list`, `add-to-shopping-list`, `shopping-list-to-cart`
  - Marketplace — merchants & offers: `get-merchants`, `get-merchant`, `get-product-offers`
  - B2C wishlist tools are now tagged B2C-only

### Version 0.1.0
- ✅ Dependency stack updated to latest majors (zod 4 with native JSON schema, TypeScript 6, ESLint 10 flat config, Jest 30); removed unused `axios`; added the previously-undeclared `zod-to-json-schema` usage by migrating to zod's native `z.toJSONSchema()`
- ✅ Expanded commerce coverage from 11 to 30 tools:
  - Richer products: `get-concrete-product`, `get-product-availability`, `get-product-prices`, `get-product-reviews`, and concrete-variant resolution in `get-product`
  - Catalog navigation: `get-category-tree`, `get-category`, `search-suggestions`
  - Cart & promotions: `add-cart-voucher`, `remove-cart-voucher`, `get-wishlists`, `create-wishlist`, `add-to-wishlist`, `wishlist-to-cart`
  - Customer & orders: `register-customer`, `refresh-token`, `get-addresses`, `add-address`, `update-address`, `delete-address`

### Version 0.0.1
- ✅ Initial TypeScript implementation
- ✅ Core Spryker API integration
- ✅ Eleven essential MCP tools (product search, authentication, cart management, checkout, order management)
- ✅ Five contextual MCP prompts for e-commerce guidance
- ✅ Error handling and logging
- ✅ Configuration management with validation
- ✅ Multiple transport support (stdio, HTTP, SSE)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

### Getting Help
- **Documentation**: Check this README and inline code documentation
- **Issues**: [GitHub Issues](https://github.com/yourusername/spryker-mcp-server/issues)

### Common Issues
1. **Connection Errors**: Verify `SPRYKER_API_BASE_URL` is correct and accessible
2. **Authentication Failures**: Ensure customer tokens are valid and not expired
3. **Tool Not Found**: Check tool registration in `src/tools/index.ts`

---

## 🔧 Logging & Debugging

### Dynamic Log Level Control
The server supports runtime log level changes through the MCP `logging/setLevel` method, allowing you to adjust logging verbosity without restarting the server.

**Supported Log Levels:**
- `debug` - Detailed debugging information
- `info` - General operational messages (default)
- `notice` - Significant events (mapped to info)
- `warning` - Warning conditions
- `error` - Error conditions
- `critical` - Critical conditions (mapped to error)
- `alert` - Alert conditions (mapped to error)
- `emergency` - Emergency conditions (mapped to error)

**MCP Request Example:**
```json
{
  "method": "logging/setLevel",
  "params": {
    "level": "debug"
  }
}
```

**Enhanced Response Format:**
The setLevel method returns a detailed response confirming the level change:
```json
{
  "message": "Log level changed from 'info' to 'debug'",
  "previousLevel": "info",
  "newLevel": "debug",
  "requestedLevel": "debug",
  "timestamp": "2025-06-03T16:30:00.000Z"
}
```

**Response Fields:**
- `message` - Human-readable confirmation message
- `previousLevel` - Log level before the change
- `newLevel` - Log level after the change
- `requestedLevel` - The level that was requested (may differ if invalid)
- `timestamp` - ISO timestamp when the change occurred

**Claude Desktop Usage:**
When using with Claude Desktop, you can ask the assistant to change the log level:
> "Please set the logging level to debug so I can see more detailed information"

The assistant will receive the detailed response and can inform you of the successful change.

**Benefits:**
- **Real-time debugging**: Increase verbosity when troubleshooting issues
- **Performance optimization**: Reduce logging in production environments
- **Flexible monitoring**: Adjust detail level based on current needs
- **No service interruption**: Changes take effect immediately
- **Confirmation feedback**: Detailed response confirms the change was applied

### Log Format
All logs are structured JSON with consistent fields:
```json
{
  "timestamp": "2025-06-03T16:30:00.000Z",
  "level": "info",
  "component": "SprykerMCP",
  "message": "Tool executed successfully",
  "metadata": {
    "toolName": "product-search",
    "duration": 245
  }
}
```
