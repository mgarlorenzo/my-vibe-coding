package com.example.employeemanager.api.graphql;

import graphql.language.StringValue;
import graphql.schema.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

import java.time.Instant;
import java.time.format.DateTimeParseException;

@Configuration
public class DateTimeScalarConfig {
    
    @Bean
    public RuntimeWiringConfigurer runtimeWiringConfigurer() {
        return wiringBuilder -> wiringBuilder.scalar(dateTimeScalar());
    }
    
    private GraphQLScalarType dateTimeScalar() {
        return GraphQLScalarType.newScalar()
                .name("DateTime")
                .description("A date-time string in ISO 8601 format")
                .coercing(new Coercing<Instant, String>() {
                    @Override
                    public String serialize(Object dataFetcherResult) throws CoercingSerializeException {
                        if (dataFetcherResult instanceof Instant) {
                            return ((Instant) dataFetcherResult).toString();
                        }
                        throw new CoercingSerializeException("Expected an Instant object");
                    }
                    
                    @Override
                    public Instant parseValue(Object input) throws CoercingParseValueException {
                        try {
                            if (input instanceof String) {
                                return Instant.parse((String) input);
                            }
                            throw new CoercingParseValueException("Expected a String");
                        } catch (DateTimeParseException e) {
                            throw new CoercingParseValueException("Invalid DateTime format: " + input, e);
                        }
                    }
                    
                    @Override
                    public Instant parseLiteral(Object input) throws CoercingParseLiteralException {
                        if (input instanceof StringValue) {
                            try {
                                return Instant.parse(((StringValue) input).getValue());
                            } catch (DateTimeParseException e) {
                                throw new CoercingParseLiteralException("Invalid DateTime format", e);
                            }
                        }
                        throw new CoercingParseLiteralException("Expected a StringValue");
                    }
                })
                .build();
    }
}
