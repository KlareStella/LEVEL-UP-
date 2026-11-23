
package tienda_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tienda_backend.entidades.detalleBoleta;
import tienda_backend.repository.detalleBoletaRepository;

import java.util.List;

@Service
public class detalleBoletaService {

    private final detalleBoletaRepository repository;

    public detalleBoletaService(
        detalleBoletaRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<detalleBoleta> listar() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public detalleBoleta buscarPorId(Long id) {
        return repository.findById(id)
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "Detalle no encontrado: " + id
                )
            );
    }

    @Transactional(readOnly = true)
    public List<detalleBoleta> buscarPorBoleta(
        Long boletaId
    ) {
        return repository.findByBoleta_Id(boletaId);
    }
}
