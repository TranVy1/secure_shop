package secure_shop.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

        @Bean
        public OpenAPI customOpenAPI() {
                return new OpenAPI()
                                .info(new Info()
                                                .title("REST API Documentation - Security Shop")
                                                .version("1.0.0")
                                                .description("Tài liệu API chi tiết cho dự án E-Commerce Spring Boot.")
                                                .contact(new Contact()
                                                                .name("Developer")
                                                                .email("support@mc4vn.net"))
                                                .license(new License().name("Apache 2.0").url("http://springdoc.org")));
        }
}
