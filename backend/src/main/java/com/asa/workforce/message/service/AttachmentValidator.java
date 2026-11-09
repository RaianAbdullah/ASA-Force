package com.asa.workforce.message.service;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.zip.*;

@Component
public class AttachmentValidator {
    public void validate(MultipartFile file, String extension) throws IOException {
        if (file.getSize() > 10 * 1024 * 1024) throw new IllegalArgumentException("Attachment exceeds 10 MB");
        byte[] bytes = file.getBytes();
        String prefix = new String(bytes, 0, Math.min(bytes.length, 16), StandardCharsets.ISO_8859_1);
        boolean valid = switch (extension) {
            case "jpg", "jpeg" -> bytes.length > 3 && (bytes[0]&255)==255 && (bytes[1]&255)==216 && (bytes[2]&255)==255;
            case "png" -> prefix.startsWith("\u0089PNG\r\n\u001a\n");
            case "gif" -> prefix.startsWith("GIF87a") || prefix.startsWith("GIF89a");
            case "webp" -> prefix.startsWith("RIFF") && prefix.substring(8).startsWith("WEBP");
            case "pdf" -> prefix.startsWith("%PDF-") && !new String(bytes, StandardCharsets.ISO_8859_1).matches("(?s).*(/JavaScript|/JS|/Launch|/EmbeddedFile).* ".strip());
            case "txt" -> validText(bytes);
            case "docx", "xlsx" -> validOffice(bytes, extension);
            default -> false;
        };
        if (!valid) throw new IllegalArgumentException("Attachment content does not match a supported safe format");
    }
    private boolean validText(byte[] bytes) {
        try {
            String text = StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(bytes)).toString();
            return text.chars().noneMatch(c -> c == 0 || (c < 32 && c != 9 && c != 10 && c != 13));
        } catch (java.nio.charset.CharacterCodingException e) { return false; }
    }
    private boolean validOffice(byte[] bytes, String extension) throws IOException {
        boolean types = false, document = false;
        long expanded = 0; int entries = 0;
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry; byte[] buffer = new byte[8192];
            while ((entry = zip.getNextEntry()) != null) {
                if (++entries > 1000) return false;
                String name = entry.getName().toLowerCase(Locale.ROOT);
                if (name.contains("vbaproject") || name.contains("activex") || name.contains("embeddings/") || name.contains("..")) return false;
                if (name.equals("[content_types].xml")) types = true;
                if (name.equals(extension.equals("docx") ? "word/document.xml" : "xl/workbook.xml")) document = true;
                int read;
                while ((read = zip.read(buffer)) != -1) if ((expanded += read) > 30 * 1024 * 1024) return false;
            }
        } catch (ZipException ex) { return false; }
        return types && document;
    }
}
