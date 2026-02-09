import java.security.*;
import java.util.Base64;
import java.io.FileOutputStream;
import java.io.File;

public class KeyGen {
    public static void main(String[] args) throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        File dir = new File("src/main/resources/keys");
        if (!dir.exists())
            dir.mkdirs();

        try (FileOutputStream out = new FileOutputStream("src/main/resources/keys/private.pem")) {
            out.write("-----BEGIN PRIVATE KEY-----\n".getBytes());
            out.write(Base64.getMimeEncoder(64, new byte[] { '\n' }).encode(kp.getPrivate().getEncoded()));
            out.write("\n-----END PRIVATE KEY-----\n".getBytes());
        }

        try (FileOutputStream out = new FileOutputStream("src/main/resources/keys/public.pem")) {
            out.write("-----BEGIN PUBLIC KEY-----\n".getBytes());
            out.write(Base64.getMimeEncoder(64, new byte[] { '\n' }).encode(kp.getPublic().getEncoded()));
            out.write("\n-----END PUBLIC KEY-----\n".getBytes());
        }
        System.out.println("Keys generated successfully!");
    }
}
