
package tienda_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class manejadorErrores {

    private ResponseEntity<Map<String, Object>> respuesta(
            HttpStatus estado,
            String mensaje) {

        Map<String, Object> cuerpo = new LinkedHashMap<>();

        cuerpo.put("fecha", LocalDateTime.now());
        cuerpo.put("codigo", estado.value());
        cuerpo.put("error", estado.getReasonPhrase());
        cuerpo.put("mensaje", mensaje);

        return ResponseEntity.status(estado).body(cuerpo);
    }

    @ExceptionHandler(recursoNoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> noEncontrado(
            recursoNoEncontradoException ex) {

        return respuesta(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(noAutorizadoException.class)
    public ResponseEntity<Map<String, Object>> noAutorizado(
            noAutorizadoException ex) {

        return respuesta(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(conflictoException.class)
    public ResponseEntity<Map<String, Object>> conflicto(
            conflictoException ex) {

        return respuesta(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> argumentoInvalido(
            IllegalArgumentException ex) {

        return respuesta(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> estadoInvalido(
            IllegalStateException ex) {

        return respuesta(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacion(
            MethodArgumentNotValidException ex) {

        String mensaje = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .findFirst()
            .map(error -> error.getDefaultMessage())
            .orElse("Datos inválidos");

        return respuesta(HttpStatus.BAD_REQUEST, mensaje);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> jsonInvalido(
            HttpMessageNotReadableException ex) {

        return respuesta(
            HttpStatus.BAD_REQUEST,
            "El cuerpo JSON es inválido"
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> integridad(
            DataIntegrityViolationException ex) {

        return respuesta(
            HttpStatus.CONFLICT,
            "La operación entra en conflicto con los datos existentes"
        );
    }
}
