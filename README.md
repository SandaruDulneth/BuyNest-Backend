# BuyNest - E-commerce Website Backend⚙️

Elora’s backend is a secure and scalable REST API that powers the Elora cosmetic e-commerce platform.
It is built with `Node.js` `Express` `MongoDB` providing all core services—authentication, product management, and order processing—for the React/Tailwind frontend.
## Features

- Authentication & Authorization: JSON Web Tokens `JWT` for secure user sessions and role-based access.
- MongoDB Integration: Flexible `NoSQL` database for products, orders, and user data.
- Email Notifications: `SendGrid` support for order confirmations and password resets.
- RESTful API: Endpoints for products, users, orders, and cart management.
- Scalable Architecture – Modular controllers, services, and models designed for horizontal scaling and microservice adoption.

# Installation

To set up the project locally, follow these steps:

## Setup🔧
The backend for this project is hosted in a separate repository. Follow these steps to set up the backend API server:

### Clone the Repository

```bash
git clone https://github.com/SandaruDulneth/BuyNest-Backend
cd elora-backend
```

### Install dependencies
```bash
npm install
```

### Start development server
```bash
npm start
```

### Set up Environment Variables
Create a .env file in the root of the elora-backend directory and configure the necessary environment variables <br>
```bash
STRIPE_SECRET_KEY
TWILIO_PHONE_NUMBER
TWILIO_AUTH_TOKEN 
TWILIO_ACCOUNT_SID
GOOGLE_MAPS_API_KEY
BACKENDURL
FRONTENDURL
JWTKEY
MONGODB_URL
SENDGRID_FROM
MAIL_PASS
MAIL_USER
```

### License
MIT License






