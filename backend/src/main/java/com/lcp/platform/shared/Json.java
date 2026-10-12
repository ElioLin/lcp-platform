package com.lcp.platform.shared;

import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.lcp.platform.metadata.Choice;

@Component
public class Json {
    private final ObjectMapper mapper;
    public Json(ObjectMapper mapper) { this.mapper = mapper; }
    public String write(Object value) { return mapper.writeValueAsString(value); }
    public List<Choice> choices(String text) { return mapper.readValue(text, new TypeReference<List<Choice>>() {}); }
}
