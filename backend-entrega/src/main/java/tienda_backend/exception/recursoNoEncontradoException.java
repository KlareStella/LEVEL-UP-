
package tienda_backend.exception;

public class recursoNoEncontradoException
        extends RuntimeException {

    public recursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
