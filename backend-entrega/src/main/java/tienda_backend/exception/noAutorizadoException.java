package tienda_backend.exception;

public class noAutorizadoException extends RuntimeException {

    public noAutorizadoException(String mensaje) {
        super(mensaje);
    }
}
