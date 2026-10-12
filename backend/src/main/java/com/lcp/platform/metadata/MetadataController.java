package com.lcp.platform.metadata;

import java.util.List;
import java.util.UUID;
import com.lcp.platform.identity.Users;
import com.lcp.platform.metadata.DefinitionInputs.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/metadata/objects")
public class MetadataController {
    private final Catalog catalog;
    private final Users users;
    public MetadataController(Catalog catalog, Users users) { this.catalog = catalog; this.users = users; }
    @GetMapping List<ObjectDefinition> list(Authentication auth) { return catalog.list(users.caller(auth)); }
    @GetMapping("/{name}") ObjectDefinition get(@PathVariable String name, Authentication auth) { return catalog.get(name, users.caller(auth).isAdmin()); }
    @PostMapping ObjectDefinition create(@Valid @RequestBody NewObject input, Authentication auth) { return catalog.create(input, users.caller(auth)); }
    @PutMapping("/{name}") ObjectDefinition labels(@PathVariable String name, @Valid @RequestBody ObjectLabels input, Authentication auth) { return catalog.updateLabels(name, input, users.caller(auth)); }
    @PostMapping("/{name}/fields") ObjectDefinition addField(@PathVariable String name, @Valid @RequestBody NewField input, Authentication auth) { return catalog.addField(name, input, users.caller(auth)); }
    @PutMapping("/{name}/fields/{id}") ObjectDefinition editField(@PathVariable String name, @PathVariable UUID id, @Valid @RequestBody NewField input, Authentication auth) { return catalog.updateField(name, id, input, users.caller(auth)); }
    @DeleteMapping("/{name}/fields/{id}") ObjectDefinition removeField(@PathVariable String name, @PathVariable UUID id, Authentication auth) { return catalog.deleteDraftField(name, id, users.caller(auth)); }
    @PostMapping("/{name}/publish") ObjectDefinition publish(@PathVariable String name, Authentication auth) { return catalog.publish(name, users.caller(auth)); }
}
