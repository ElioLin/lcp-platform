package com.lcp.platform.runtime;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.lcp.platform.identity.Users;
import com.lcp.platform.metadata.Catalog;
import com.lcp.platform.metadata.ObjectDefinition;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/data/{name}")
public class DataController {
    private final Records records;
    private final Catalog catalog;
    private final Users users;
    public DataController(Records records, Catalog catalog, Users users) { this.records = records; this.catalog = catalog; this.users = users; }
    @GetMapping("/definition") ObjectDefinition definition(@PathVariable String name, Authentication auth) { users.caller(auth); return catalog.get(name, false); }
    @GetMapping Records.Page list(@PathVariable String name, Authentication auth, @RequestParam(defaultValue="1") int page,
            @RequestParam(defaultValue="20") int size, @RequestParam(defaultValue="") String search,
            @RequestParam(defaultValue="created_at") String sort, @RequestParam(defaultValue="false") boolean ascending) {
        return records.list(name, users.caller(auth), page, size, search, sort, ascending);
    }
    @GetMapping("/{id}") Records.DataRecord get(@PathVariable String name, @PathVariable UUID id, Authentication auth) { return records.get(name, id, users.caller(auth)); }
    @PostMapping Records.DataRecord create(@PathVariable String name, @RequestBody Records.Write input, Authentication auth) { return records.create(name, input.values(), users.caller(auth)); }
    @PutMapping("/{id}") Records.DataRecord update(@PathVariable String name, @PathVariable UUID id, @RequestBody Records.Write input, Authentication auth) { return records.update(name, id, input, users.caller(auth)); }
    @GetMapping("/{id}/history") List<Map<String,Object>> history(@PathVariable String name, @PathVariable UUID id, Authentication auth) { return records.history(name, id, users.caller(auth)); }
}
