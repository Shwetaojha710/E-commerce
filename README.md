# ShopSphere – Advanced MERN E-Commerce Platform

> A production-ready, full-stack e-commerce web application built with the MERN stack. Features JWT auth, role-based access, Stripe/Razorpay payments, Cloudinary image uploads, real-time admin analytics, and a responsive dark/light UI.

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite, Redux Toolkit, Tailwind CSS, Framer Motion |
| Backend     | Node.js, Express.js, MongoDB, Mongoose |
| Auth        | JWT + Refresh Tokens, bcryptjs      |
| Payments    | Stripe + Razorpay + Cash on Delivery |
| Images      | Cloudinary + Multer                 |
| Email       | Nodemailer (SMTP)                   |
| DevOps      | Docker + Docker Compose             |
| API Docs    | Swagger / OpenAPI 3.0               |
| Security    | Helmet, CORS, Rate Limiting, Mongo Sanitize |

---

## Features

### User
- Register / Login / Logout with JWT + refresh token rotation
- Email verification & forgot/reset password
- Browse products with search, filter, sort, pagination
- Product detail with image gallery, variants, reviews
- Cart management with quantity controls, coupon codes
- Wishlist & recently viewed products
- Checkout with saved addresses
- Stripe / Razorpay / COD payment
- Order tracking with status timeline
- User profile & avatar upload

### Admin Dashboard
- Sales revenue charts (area + bar + pie)
- Real-time order management with status updates
- Product CRUD with multi-image upload
- Category management
- User management (activate/deactivate)
- Coupon/discount management

### Technical
- RESTful API with versioning (`/api/v1/`)
- Centralized error handling
- Winston logging
- Swagger API docs at `/api/docs`
- Code splitting with lazy loading
- Persistent Redux state with redux-persist
- Dark/Light theme toggle

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Cloudinary account
- Stripe or Razorpay account (optional for payments)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/shopsphere.git
cd shopsphere

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Fill in your values in .env
```

### 3. Run Development

```bash
# Terminal 1 – Backend
cd backend
npm run dev

# Terminal 2 – Frontend
cd frontend
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- API: http://localhost:5000
- API Docs: http://localhost:5000/api/docs

---

## Docker Deployment

```bash
# Copy and fill backend env
cp backend/.env.example backend/.env

# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f backend
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

---

## Project Structure

```
e-commerce/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, Swagger
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, error, validation
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   └── utils/           # Helpers, email, tokens
│   ├── server.js
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios service layer
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Route-level pages
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   └── admin/
│   │   ├── store/           # Redux Toolkit store + slices
│   │   └── utils/           # Helper functions
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh-token` | Refresh JWT |
| GET  | `/api/v1/products` | List products (search, filter, paginate) |
| GET  | `/api/v1/products/:slug` | Product detail |
| POST | `/api/v1/cart/add` | Add to cart |
| POST | `/api/v1/orders` | Place order |
| POST | `/api/v1/payments/razorpay/create-order` | Create Razorpay order |
| POST | `/api/v1/payments/stripe/create-intent` | Create Stripe intent |
| GET  | `/api/v1/admin/dashboard` | Admin analytics |

Full docs available at `/api/docs` when running the server.

---

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for all required variables.

Key variables:
```env
MONGO_URI=mongodb://localhost:27017/shopsphere
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
SMTP_USER=your@gmail.com
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License © 2025 ShopSphere

---

## Author

Built with ❤️ as a full-stack portfolio project demonstrating enterprise-grade MERN development.
