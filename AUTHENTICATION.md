# Authentication & Shopping List System

## Overview

Olivia's Beauty Vault now includes a password-based authentication system with two user types:

- **Admin**: Full access to all features (password: "wally")
- **Guest**: Limited access to view shelf products and create shopping lists (password: "winnie")

## User Types

### Admin User
- **Name**: `Olivia`
- **Password**: `wally`
- **Access**: Full control over the beauty vault
- **Features**:
  - View all products (in vault, on shelf, used up)
  - Add products to vault
  - Scan out products
  - Edit product details
  - Clear database
  - View and manage all shopping lists
  - Check out items from any shopping list

### Guest User
- **Password**: `winnie`
- **Name**: Required (unique per guest)
- **Access**: Limited to shelf products only
- **Features**:
  - View products on shelf
  - Add products to personal shopping list
  - Manage personal shopping list (update quantities, remove items, check out items)
  - Check out entire shopping list
  - View checkout history with totals and product details

## Authentication Flow

1. **Initial Load**: Users are presented with a login modal
2. **Session Management**: Sessions persist for 2 hours
3. **Auto-login**: If a valid session exists, users are automatically logged in
4. **Session Expiry**: Expired sessions redirect to login

## Shopping List System

### Guest Shopping Lists
- Each guest has their own personal shopping list
- Lists persist across sessions
- Guests can:
  - Add products from the shelf
  - Update quantities
  - Remove items
  - Check out individual items
  - Check out entire list
- **Auto-completion**: Shopping lists are automatically removed when all items are checked out individually

### Admin Shopping List Management
- View all active shopping lists
- See guest names and list contents
- Manage individual items:
  - Check out items
  - Remove items
- Bulk actions:
  - Check out all items in a list
  - Clear entire shopping list
- **Auto-completion**: Shopping lists are automatically removed when all items are checked out individually

## Database Schema

### New Tables

#### `users`
- `id`: UUID primary key
- `name`: User name
- `password`: Password (plain text for simplicity)
- `role`: 'admin' or 'guest'
- `session_token`: Current session token
- `session_expires_at`: Session expiration timestamp

#### `shopping_lists`
- `id`: UUID primary key
- `user_id`: Foreign key to users
- `name`: List name (auto-generated)
- `is_active`: Boolean flag

#### `shopping_list_items`
- `id`: UUID primary key
- `shopping_list_id`: Foreign key to shopping_lists
- `product_id`: Foreign key to products
- `quantity`: Item quantity
- `is_checked_out`: Boolean flag

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Shopping Lists (Guest)
- `GET /api/shopping-list` - Get user's shopping list
- `POST /api/shopping-list` - Add item to shopping list
- `PUT /api/shopping-list/items/[id]` - Update item quantity
- `PATCH /api/shopping-list/items/[id]` - Check out item
- `DELETE /api/shopping-list/items/[id]` - Remove item
- `GET /api/guest/checkout-history` - Get user's checkout history

### Shopping Lists (Admin)
- `GET /api/admin/shopping-lists` - Get all shopping lists
- `DELETE /api/admin/shopping-lists` - Clear a shopping list
- `PATCH /api/admin/shopping-list-items/[id]` - Check out item
- `DELETE /api/admin/shopping-list-items/[id]` - Remove item
- `POST /api/admin/shopping-lists/[id]/checkout-all` - Check out all items

## Setup Instructions

1. **Database Setup**: Run the schema.sql file to create new tables
   ```bash
   ./scripts/setup-auth-db.sh
   ```

2. **Environment Variables**: Ensure your database connection is configured

3. **Start Application**: The authentication system will be active on startup

## Security Notes

- This is a simple access control system, not a secure authentication system
- Passwords are stored in plain text
- Session tokens are stored in localStorage
- Intended for personal/family use, not production deployment

## Usage Examples

### Admin Login
1. Enter password: `wally`
2. Access full admin interface
3. View "All Lists" button to manage shopping lists

### Guest Login
1. Enter name (e.g., "Sarah")
2. Enter password: `winnie`
3. View only shelf products
4. Use "Add to Shopping List" button
5. Access shopping list via "Shopping List" button

### Shopping List Management
- **Guests**: Manage their own list
- **Admins**: View all lists, manage items, check out products 