#!/bin/bash

# Script triển khai ứng dụng Chatly backend

# Kiểm tra môi trường
if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV không được thiết lập. Sử dụng 'production' làm mặc định."
  export NODE_ENV=production
fi

echo "Triển khai Chatly API trong môi trường: $NODE_ENV"

# Cập nhật code từ repository
echo "Cập nhật code từ repository..."
git pull

# Cài đặt dependencies
echo "Cài đặt dependencies..."
npm install

# Build ứng dụng
echo "Build ứng dụng..."
npm run build

# Tạo thư mục logs nếu chưa tồn tại
mkdir -p logs

# Khởi động ứng dụng với PM2
echo "Khởi động ứng dụng với PM2..."
if [ "$NODE_ENV" = "production" ]; then
  npm run pm2:restart -- --env production
elif [ "$NODE_ENV" = "staging" ]; then
  npm run pm2:restart -- --env staging
else
  npm run pm2:restart
fi

echo "Triển khai hoàn tất!" 