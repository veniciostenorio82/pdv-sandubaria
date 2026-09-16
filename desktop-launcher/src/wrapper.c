#define _GNU_SOURCE
#include <errno.h>
#include <libgen.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static void show_error(const char *message) {
    if (fork() == 0) {
        execlp("zenity", "zenity", "--error", "--title=PDV Sandubaria", "--text", message, "--no-wrap", (char *)NULL);
        execlp("notify-send", "notify-send", "PDV Sandubaria", message, (char *)NULL);
        _exit(1);
    }
}

int main(void) {
    char exe[PATH_MAX];
    ssize_t n = readlink("/proc/self/exe", exe, sizeof(exe) - 1);
    if (n < 0) {
        fprintf(stderr, "pdv-sandubaria: nao foi possivel localizar o executavel\n");
        show_error("Nao foi possivel localizar o launcher do PDV Sandubaria.");
        return 1;
    }
    exe[n] = '\0';

    char dirbuf[PATH_MAX];
    strncpy(dirbuf, exe, sizeof(dirbuf) - 1);
    dirbuf[sizeof(dirbuf) - 1] = '\0';
    char *dir = dirname(dirbuf);

    char node[PATH_MAX];
    char script[PATH_MAX];
    if (snprintf(node, sizeof(node), "%s/lib/node", dir) >= (int)sizeof(node) ||
        snprintf(script, sizeof(script), "%s/lib/launcher.js", dir) >= (int)sizeof(script)) {
        fprintf(stderr, "pdv-sandubaria: caminho muito longo\n");
        show_error("O caminho de instalacao do PDV Sandubaria e muito longo.");
        return 1;
    }

    if (setenv("PDV_APP_DIR", dir, 1) != 0) {
        fprintf(stderr, "pdv-sandubaria: falha ao definir PDV_APP_DIR\n");
        show_error("Falha ao iniciar o PDV Sandubaria.");
        return 1;
    }

    execl(node, "node", script, (char *)NULL);
    fprintf(stderr, "pdv-sandubaria: falha ao executar %s: %s\n", node, strerror(errno));
    show_error("Pacote incompleto: o runtime do Print Agent nao foi encontrado.\nReinstale o PDV Sandubaria.");
    return 1;
}
