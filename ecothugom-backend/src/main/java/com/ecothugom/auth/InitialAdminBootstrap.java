package com.ecothugom.auth;

import jakarta.validation.Validator;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.bootstrap.admin.enabled", havingValue = "true")
public class InitialAdminBootstrap implements ApplicationRunner {
    private final Environment environment;
    private final Validator validator;
    private final AccountService accounts;

    public InitialAdminBootstrap(Environment environment, Validator validator, AccountService accounts) {
        this.environment = environment;
        this.validator = validator;
        this.accounts = accounts;
    }

    @Override public void run(ApplicationArguments args) {
        var request = new RegistrationRequest(environment.getProperty("BOOTSTRAP_ADMIN_NAME"),
            environment.getProperty("BOOTSTRAP_ADMIN_PHONE"), environment.getProperty("BOOTSTRAP_ADMIN_EMAIL"),
            environment.getProperty("BOOTSTRAP_ADMIN_PASSWORD"));
        if (!validator.validate(request).isEmpty()) {
            throw new IllegalStateException("Invalid initial admin settings. Use scripts/create-initial-admin.ps1; no account was changed.");
        }
        accounts.bootstrapAdmin(request);
    }
}
