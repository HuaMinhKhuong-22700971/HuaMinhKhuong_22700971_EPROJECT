
Dự án **EProject Phase 1** mô phỏng **hệ thống thương mại điện tử** theo kiến trúc **Microservices**.  
Mỗi service đảm nhiệm một vai trò độc lập (Authentication, Product, Order), giao tiếp với nhau thông qua **Message Broker (RabbitMQ)** và được triển khai bằng **Docker**.



Hệ thống được thiết kế nhằm mục đích học tập và thực hành kiến trúc microservices, bao gồm:
- Phân tách chức năng theo service
- Giao tiếp qua hàng đợi thông điệp (message queue)
- Quản lý bằng Docker Compose
- Kiểm thử API qua Postman

---

##Kiến trúc hệ thống

EProject-Phase-1/
│
├── api-gateway/ # Service cổng API trung gian
│ ├── Dockerfile
│ ├── index.js
│ ├── package.json
│ └── package-lock.json
│
├── auth/ # Service xác thực người dùng
│ ├── src/
│ │ ├── config/ # Cấu hình kết nối DB
│ │ ├── controllers/ # Bộ điều khiển logic (authController.js)
│ │ ├── middlewares/ # Xác thực JWT (authMiddleware.js)
│ │ ├── models/ # Định nghĩa schema User
│ │ ├── repositories/ # Tầng truy cập dữ liệu (userRepository.js)
│ │ └── services/ # Tầng nghiệp vụ (authService.js)
│ ├── test/ # Test unit (nếu có)
│ ├── Dockerfile
│ ├── index.js
│ ├── app.js
│ └── .env
│
├── product/ # Service quản lý sản phẩm
│ ├── src/
│ │ ├── controllers/ # Xử lý API sản phẩm
│ │ ├── middlewares/
│ │ ├── models/ # Schema sản phẩm
│ │ ├── repositories/ # Truy xuất dữ liệu sản phẩm
│ │ ├── routes/ # Định tuyến API
│ │ ├── services/ # Nghiệp vụ sản phẩm
│ │ ├── test/ # Unit test sản phẩm
│ │ └── utils/ # Tiện ích chung (messageBroker.js, isAuthenticated.js)
│ ├── app.js
│ ├── config.js
│ ├── Dockerfile
│ ├── .env
│ └── index.js
│
├── order/ # Service quản lý đơn hàng
│ ├── src/
│ │ ├── controllers/ # Xử lý API đơn hàng
│ │ ├── models/ # Schema đơn hàng (order.js)
│ │ ├── middlewares/
│ │ └── utils/
│ ├── app.js
│ ├── config.js
│ ├── Dockerfile
│ ├── .env
│ └── index.js
│
├── docker-compose.yml # File Docker Compose quản lý toàn bộ services
├── .gitignore
└── README.md



## Công nghệ sử dụng

| Thành phần | Công nghệ |
|-------------|------------|
| Ngôn ngữ | Node.js (Express.js) |
| Cơ sở dữ liệu | MongoDB |
| Message Broker | RabbitMQ |
| Triển khai | Docker & Docker Compose |
| API Gateway | Express.js (Reverse Proxy Pattern) |
| Kiểm thử | Postman |
| Giao tiếp giữa các service | HTTP + Message Queue |

---

## Cách cài đặt & chạy dự án

### 1️⃣ Clone dự án
```bash
git clone https://github.com/HuaMinhKhuong_22700971/EProject-Phase-1.git
cd EProject-Phase-1

Chạy toàn bộ hệ thống bằng Docker
docker compose up --build

3️⃣ Kiểm tra các container đang chạy
docker ps

4️⃣ Truy cập các service:
Service	URL
API Gateway	http://localhost:3003

Auth Service	http://localhost:3000

Product Service	http://localhost:3001

Order Service	http://localhost:3002

RabbitMQ Dashboard	http://localhost:15672

Luồng hoạt động (Flow)

Người dùng đăng ký / đăng nhập → Auth Service sinh JWT.

API Gateway nhận request → kiểm tra token → định tuyến tới service phù hợp.

Khi người dùng đặt hàng, Product Service gửi thông điệp đến Order Service qua RabbitMQ.

Order Service xử lý đơn hàng và phản hồi trạng thái (pending → confirmed).