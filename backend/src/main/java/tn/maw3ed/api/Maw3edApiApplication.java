package tn.maw3ed.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class Maw3edApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(Maw3edApiApplication.class, args);
    }
}
