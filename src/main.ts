import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvVars } from './config/env.validation';
import { corsConfig } from './config/cors.config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService<EnvVars>)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );
    app.enableCors(corsConfig());

    app.setGlobalPrefix('api/v1');

 const configSwgger = new DocumentBuilder()
    .setTitle('CourseHub')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, configSwgger);
  SwaggerModule.setup('api', app, document);

    await app.listen(config.get('PORT', { infer: true })!);
    console.log(
        `🚀 Server is running at http://localhost:${config.get('PORT')}/api`,
        'bootstrap',
    );
}
bootstrap();
