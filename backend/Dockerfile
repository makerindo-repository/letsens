FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    sqlite-dev \
    oniguruma-dev \
    libzip-dev \
    icu-dev

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_sqlite \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    intl \
    zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/backend

# Copy application code
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions for storage & cache
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
