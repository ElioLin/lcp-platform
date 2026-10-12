package com.lcp.platform.metadata;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class DefinitionInputs {
    private DefinitionInputs() {}
    public record NewObject(@NotBlank @Pattern(regexp="[a-z][a-z0-9_]{1,49}") String name,
                            @NotBlank @Size(max=100) String label, @Size(max=1000) String description) {}
    public record ObjectLabels(@NotBlank @Size(max=100) String label, @Size(max=1000) String description) {}
    public record NewField(@NotBlank @Pattern(regexp="[a-z][a-z0-9_]{1,49}") String name,
                           @NotBlank @Size(max=100) String label, @NotNull FieldType type,
                           boolean required, Integer precision, Integer scale, List<Choice> options) {}
}
