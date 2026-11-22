
package tienda_backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "boletas")
public class boleta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @NotNull(message = "El total es obligatorio")
    @DecimalMin(value = "0.0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private String estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private usuario usuario;

    @Column(precision = 5, scale = 2)
    private BigDecimal descuentoPorcentaje = BigDecimal.ZERO;

    @OneToMany(
        mappedBy = "boleta",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<detalleBoleta> detalles = new ArrayList<>();

    public boleta() {
        this.fecha = LocalDateTime.now();
        this.total = BigDecimal.ZERO;
        this.estado = "PENDIENTE";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(usuario usuario) {
        this.usuario = usuario;
    }

    public List<detalleBoleta> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<detalleBoleta> detalles) {
        this.detalles = detalles;
    }

    public void agregarDetalle(detalleBoleta detalle) {
        detalles.add(detalle);
        detalle.setBoleta(this);
    }
    public BigDecimal getDescuentoPorcentaje() {
    return descuentoPorcentaje;
    }

    public void setDescuentoPorcentaje(BigDecimal descuentoPorcentaje) {
    this.descuentoPorcentaje = descuentoPorcentaje;
    }
}
