/* Contenido del sitio: servicios, capas del servidor, desarrollo, proyectos,
   trayectoria, certificaciones y preguntas del formulario.
   Para agregar un proyecto, copiá un bloque de PROJECTS y cambiá los textos. */
(function () {
  "use strict";
  var GH = "https://github.com/GonzaBot";

  window.RDM_DATA = {
    links: {
      github: GH,
      linkedin: "https://www.linkedin.com/in/gonzardem"
    },

    stats: [
      { n: "500+", k: "stat.hours" },
      { n: "80+", k: "stat.repos" },
      { n: "3", k: "stat.langs" },
      { n: "2", k: "stat.schools" }
    ],

    services: [
      {
        id: "infra", icon: "server",
        t: { es: "Servidores e infraestructura", pt: "Servidores e infraestrutura", en: "Servers and infrastructure" },
        d: { es: "Tu sistema de gestión, tu web o tus archivos compartidos corriendo en un servidor estable, seguro y con respaldo.",
             pt: "Seu sistema de gestão, seu site ou seus arquivos compartilhados rodando em um servidor estável, seguro e com backup.",
             en: "Your management system, website or shared files running on a stable, secure server with backups." },
        items: {
          es: ["Instalación de Linux y Docker en tu equipo o en la nube", "Endurecimiento, firewall y acceso seguro", "Respaldos automáticos y monitoreo con alertas"],
          pt: ["Instalação de Linux e Docker no seu equipamento ou na nuvem", "Hardening, firewall e acesso seguro", "Backups automáticos e monitoramento com alertas"],
          en: ["Linux and Docker on your hardware or in the cloud", "Hardening, firewall and secure access", "Automatic backups and monitoring with alerts"]
        }
      },
      {
        id: "dev", icon: "code",
        t: { es: "Desarrollo web, escritorio y mobile", pt: "Desenvolvimento web, desktop e mobile", en: "Web, desktop and mobile development" },
        d: { es: "El software que tu negocio necesita, hecho a medida, probado y con la seguridad incorporada desde el diseño.",
             pt: "O software que o seu negócio precisa, sob medida, testado e com segurança desde o projeto.",
             en: "The software your business needs, custom-built, tested and secure by design." },
        items: {
          es: ["Sitios web y sistemas de gestión", "Aplicaciones de escritorio a medida", "Apps para Android e iPhone"],
          pt: ["Sites e sistemas de gestão", "Aplicativos desktop sob medida", "Apps para Android e iPhone"],
          en: ["Websites and management systems", "Custom desktop applications", "Android and iPhone apps"]
        }
      },
      {
        id: "support", icon: "wrench",
        t: { es: "Soporte y mantenimiento de TI", pt: "Suporte e manutenção de TI", en: "IT support and maintenance" },
        d: { es: "Alguien que conoce tus equipos, tu red y tus sistemas, y los mantiene en orden antes de que fallen.",
             pt: "Alguém que conhece seus equipamentos, sua rede e seus sistemas, e mantém tudo em ordem antes que falhe.",
             en: "Someone who knows your computers, network and systems, and keeps them in order before they fail." },
        items: {
          es: ["Inventario de equipos y licencias", "Mantenimiento preventivo y atención a usuarios", "Red, wifi de clientes separado e impresoras"],
          pt: ["Inventário de equipamentos e licenças", "Manutenção preventiva e atendimento a usuários", "Rede, Wi-Fi de clientes separado e impressoras"],
          en: ["Hardware and license inventory", "Preventive maintenance and user support", "Network, separate guest Wi-Fi and printers"]
        }
      },
      {
        id: "auto", icon: "bolt",
        t: { es: "Automatización de procesos", pt: "Automação de processos", en: "Process automation" },
        d: { es: "Las tareas que hoy hace una persona a mano, resueltas por un flujo automático que trabaja todo el día.",
             pt: "As tarefas que hoje alguém faz à mão, resolvidas por um fluxo automático que trabalha o dia todo.",
             en: "Tasks someone does by hand today, handled by an automated flow that works around the clock." },
        items: {
          es: ["Bots que responden precios y stock", "Clasificación automática de correos", "Planillas y reportes que se completan solos"],
          pt: ["Bots que respondem preço e estoque", "Classificação automática de e-mails", "Planilhas e relatórios que se preenchem sozinhos"],
          en: ["Bots that answer price and stock questions", "Automatic email sorting", "Spreadsheets and reports that fill themselves"]
        }
      },
      {
        id: "sec", icon: "shield",
        t: { es: "Ciberseguridad para empresas", pt: "Cibersegurança para empresas", en: "Cybersecurity for businesses" },
        d: { es: "Saber dónde estás expuesto y cerrarlo, con prioridades claras y en un lenguaje que se entiende.",
             pt: "Saber onde você está exposto e fechar as brechas, com prioridades claras e em linguagem que se entende.",
             en: "Find where you're exposed and close it, with clear priorities in plain language." },
        items: {
          es: ["Diagnóstico de seguridad con informe", "Firewall, contraseñas y control de accesos", "Respuesta ante incidentes y recuperación"],
          pt: ["Diagnóstico de segurança com relatório", "Firewall, senhas e controle de acessos", "Resposta a incidentes e recuperação"],
          en: ["Security assessment with a report", "Firewall, passwords and access control", "Incident response and recovery"]
        }
      },
      {
        id: "train", icon: "teach",
        t: { es: "Capacitación", pt: "Capacitação", en: "Training" },
        d: { es: "Talleres prácticos para tu equipo, dictados por un docente que trabaja en lo que enseña.",
             pt: "Oficinas práticas para a sua equipe, com um professor que trabalha no que ensina.",
             en: "Hands-on workshops for your team, taught by someone who works in what he teaches." },
        items: {
          es: ["Seguridad para usuarios y prevención de estafas", "Inteligencia artificial aplicada al trabajo", "Planillas y herramientas digitales"],
          pt: ["Segurança para usuários e prevenção de golpes", "Inteligência artificial aplicada ao trabalho", "Planilhas e ferramentas digitais"],
          en: ["Security awareness and scam prevention", "Applied AI at work", "Spreadsheets and digital tools"]
        }
      }
    ],

    layers: [
      {
        id: "edge",
        t: { es: "Red y firewall", pt: "Rede e firewall", en: "Network and firewall" },
        s: { es: "Solo pasa lo necesario", pt: "Só passa o necessário", en: "Only what's needed gets in" },
        d: { es: "Cierro todos los puertos que no hacen falta, separo la red de la empresa de la de clientes e invitados, y dejo reglas claras y auditadas.",
             pt: "Fecho todas as portas desnecessárias, separo a rede da empresa da rede de clientes e visitantes, e deixo regras claras e auditadas.",
             en: "I close every port that isn't needed, separate the business network from guests and customers, and leave clear, audited rules." },
        tools: "UFW · iptables · VLAN · NAT · Cisco IOS",
        proof: { label: "FirewallAuditor · DMZ en Cisco ISR", href: GH + "/FirewallAuditor" }
      },
      {
        id: "access",
        t: { es: "Acceso seguro", pt: "Acesso seguro", en: "Secure access" },
        s: { es: "Llaves, no contraseñas", pt: "Chaves, não senhas", en: "Keys, not passwords" },
        d: { es: "Acceso remoto con llaves SSH, bloqueo automático de intentos de intrusión, HTTPS con certificados válidos y registro de cada comando con privilegios.",
             pt: "Acesso remoto com chaves SSH, bloqueio automático de tentativas de invasão, HTTPS com certificados válidos e registro de cada comando com privilégios.",
             en: "Remote access with SSH keys, automatic blocking of intrusion attempts, HTTPS with valid certificates and a log of every privileged command." },
        tools: "OpenSSH · Fail2Ban · TLS / OpenSSL · PAM · auditd",
        proof: { label: "maderera-hardened-server-lab", href: GH + "/maderera-hardened-server-lab" }
      },
      {
        id: "apps",
        t: { es: "Servicios en contenedores", pt: "Serviços em contêineres", en: "Containerized services" },
        s: { es: "Aislados y con reinicio solo", pt: "Isolados e com reinício automático", en: "Isolated and self-restarting" },
        d: { es: "Tus sistemas corren en contenedores sin privilegios de administrador, con reinicio automático si algo se cae y actualizaciones sin reinstalar todo.",
             pt: "Seus sistemas rodam em contêineres sem privilégios de administrador, com reinício automático se algo cair e atualizações sem reinstalar tudo.",
             en: "Your systems run in containers without admin privileges, restart automatically if something crashes and update without a full reinstall." },
        tools: "Docker · Docker Compose · systemd · Nginx",
        proof: { label: "Servidor remoto con app Flask en producción", href: GH + "/maderera-hardened-server-lab" }
      },
      {
        id: "data",
        t: { es: "Datos y respaldos", pt: "Dados e backups", en: "Data and backups" },
        s: { es: "Un respaldo que no se probó no existe", pt: "Backup não testado não existe", en: "An untested backup doesn't exist" },
        d: { es: "Copias automáticas fuera del servidor, con integridad verificada por hash y una restauración de prueba para confirmar que sirven el día que hagan falta.",
             pt: "Cópias automáticas fora do servidor, com integridade verificada por hash e uma restauração de teste para confirmar que funcionam quando forem necessárias.",
             en: "Automatic off-server copies, integrity checked by hash, and a test restore to confirm they work on the day you need them." },
        tools: "rsync · cron / systemd timers · SHA-256 · PostgreSQL · MySQL",
        proof: { label: "Respuesta a incidentes con preservación SHA-256", href: GH + "/live-ir-false-flag-lab" }
      },
      {
        id: "watch",
        t: { es: "Monitoreo y alertas", pt: "Monitoramento e alertas", en: "Monitoring and alerts" },
        s: { es: "Vigila todas las capas", pt: "Vigia todas as camadas", en: "Watches every layer" },
        d: { es: "Un sistema que mira los registros, el tráfico de red y los archivos críticos, y te avisa por correo o Telegram cuando algo se sale de lo normal.",
             pt: "Um sistema que observa os registros, o tráfego de rede e os arquivos críticos, e avisa por e-mail ou Telegram quando algo foge do normal.",
             en: "A system that watches logs, network traffic and critical files, and alerts you by email or Telegram when something looks wrong." },
        tools: "Wazuh · Suricata · Zeek · Velociraptor",
        proof: { label: "Wazuh con correlación multi-fuente", href: GH + "/wazuh-siem-multi-source-correlation" }
      }
    ],

    dev: [
      {
        id: "web", icon: "browser",
        t: { es: "Web", pt: "Web", en: "Web" },
        d: { es: "Sitios que presentan y venden, y sistemas web que ordenan el trabajo interno.",
             pt: "Sites que apresentam e vendem, e sistemas web que organizam o trabalho interno.",
             en: "Sites that present and sell, and web systems that organize internal work." },
        ex: { es: ["Página de tu empresa en varios idiomas", "Sistema de pedidos, turnos o inscripciones", "Paneles internos con usuarios y permisos"],
              pt: ["Site da sua empresa em vários idiomas", "Sistema de pedidos, agendamentos ou inscrições", "Painéis internos com usuários e permissões"],
              en: ["Your company site in several languages", "Ordering, booking or enrollment systems", "Internal dashboards with users and roles"] },
        stack: "HTML · CSS · JavaScript · React · Flask · Spring Boot · NestJS · SQL"
      },
      {
        id: "desktop", icon: "desktop",
        t: { es: "Escritorio", pt: "Desktop", en: "Desktop" },
        d: { es: "Aplicaciones de gestión que resuelven el problema concreto de tu negocio, sin pagar licencias de más.",
             pt: "Aplicativos de gestão que resolvem o problema concreto do seu negócio, sem pagar licenças a mais.",
             en: "Management applications that solve your business's actual problem, without paying for licenses you don't need." },
        ex: { es: ["Stock, ventas y clientes", "Reportes y control de caja", "Herramientas internas a medida"],
              pt: ["Estoque, vendas e clientes", "Relatórios e controle de caixa", "Ferramentas internas sob medida"],
              en: ["Stock, sales and customers", "Reports and cash control", "Custom internal tools"] },
        stack: "Java · Python · SQL · NoSQL"
      },
      {
        id: "mobile", icon: "phone",
        t: { es: "Mobile", pt: "Mobile", en: "Mobile" },
        d: { es: "Apps para Android e iPhone, para tus clientes o para el personal que trabaja en la calle.",
             pt: "Apps para Android e iPhone, para seus clientes ou para a equipe que trabalha na rua.",
             en: "Android and iPhone apps, for your customers or for staff working in the field." },
        ex: { es: ["Pedidos y consultas de clientes", "Seguimiento de personal o vehículos", "Avisos y notificaciones al instante"],
              pt: ["Pedidos e consultas de clientes", "Acompanhamento de equipe ou veículos", "Avisos e notificações instantâneas"],
              en: ["Customer orders and inquiries", "Staff or vehicle tracking", "Instant alerts and notifications"] },
        stack: "Android · iPhone · Kotlin · Jetpack Compose"
      }
    ],

    /* status: prod | lab | tool | wip | design
       cats: servers | dev | sec | auto | net */
    projects: [
      {
        id: "freeshop-bot", cats: ["auto"], status: "prod", featured: true,
        t: { es: "Bot de consultas de precio y stock", pt: "Bot de consultas de preço e estoque", en: "Price and stock inquiry bot" },
        s: { es: "Para un free shop de Rivera: responde en portugués a clientes brasileños, las 24 horas.",
             pt: "Para um free shop de Rivera: responde em português aos clientes brasileiros, 24 horas.",
             en: "For a Rivera duty-free shop: answers Brazilian customers in Portuguese, around the clock." },
        p: { es: "Los vendedores pierden tiempo respondiendo una y otra vez las mismas consultas de precio y disponibilidad, muchas veces fuera de horario.",
             pt: "Os vendedores perdem tempo respondendo sempre as mesmas perguntas de preço e disponibilidade, muitas vezes fora do horário.",
             en: "Sales staff lose time answering the same price and availability questions over and over, often after hours." },
        so: { es: "Un bot de Telegram conectado a un flujo de n8n que busca el producto en un catálogo de Google Sheets y responde en portugués con precio y stock. Corre en Docker y se publica mediante un túnel seguro, sin abrir puertos.",
              pt: "Um bot de Telegram ligado a um fluxo n8n que busca o produto em um catálogo do Google Sheets e responde em português com preço e estoque. Roda em Docker e é publicado por um túnel seguro, sem abrir portas.",
              en: "A Telegram bot wired to an n8n flow that looks up the product in a Google Sheets catalog and replies in Portuguese with price and stock. It runs in Docker behind a secure tunnel, with no open ports." },
        r: { es: "Consultas respondidas al instante y el catálogo se actualiza editando una planilla, sin tocar código.",
             pt: "Consultas respondidas na hora, e o catálogo é atualizado editando uma planilha, sem mexer em código.",
             en: "Instant answers, and the catalog is updated by editing a spreadsheet, no code involved." },
        stack: ["n8n", "Telegram", "Google Sheets", "Docker", "Cloudflare Tunnel"]
      },
      {
        id: "dispatch", cats: ["dev"], status: "wip", featured: true,
        t: { es: "Plataforma de despacho de viajes", pt: "Plataforma de despacho de viagens", en: "Ride dispatch platform" },
        s: { es: "Proyecto propio y confidencial: bot de WhatsApp, app Android para conductores y panel web en tiempo real.",
             pt: "Projeto próprio e confidencial: bot de WhatsApp, app Android para motoristas e painel web em tempo real.",
             en: "My own confidential project: WhatsApp bot, Android driver app and real-time web panel." },
        p: { es: "Pedir un móvil por teléfono o mensaje depende de que alguien atienda, busque un conductor libre y avise a mano.",
             pt: "Pedir um carro por telefone ou mensagem depende de alguém atender, procurar um motorista livre e avisar à mão.",
             en: "Booking a ride by phone or message depends on someone answering, finding a free driver and passing the job on by hand." },
        so: { es: "Tres productos sobre un mismo servidor: el pasajero pide por WhatsApp, el sistema ofrece el viaje al conductor libre más cercano y la central lo sigue todo en un mapa en vivo.",
              pt: "Três produtos sobre o mesmo servidor: o passageiro pede pelo WhatsApp, o sistema oferece a viagem ao motorista livre mais próximo e a central acompanha tudo num mapa ao vivo.",
              en: "Three products on one backend: the rider books on WhatsApp, the system offers the trip to the nearest free driver and dispatch follows everything on a live map." },
        r: { es: "Más de 260 pruebas automáticas y tres rondas de pentest sin hallazgos críticos, altos ni medios abiertos.",
             pt: "Mais de 260 testes automáticos e três rodadas de pentest sem achados críticos, altos ou médios em aberto.",
             en: "More than 260 automated tests and three pentest rounds with no critical, high or medium findings left open." },
        stack: ["Kotlin", "Jetpack Compose", "NestJS", "React", "PostgreSQL + PostGIS", "WhatsApp Cloud API"]
      },
      {
        id: "bitacora", cats: ["dev", "servers"], status: "design",
        t: { es: "Bitácora TI", pt: "Bitácora TI", en: "Bitácora TI" },
        s: { es: "Panel interno de equipos, pedidos de soporte y control de respaldos para un free shop.",
             pt: "Painel interno de equipamentos, chamados de suporte e controle de backups para um free shop.",
             en: "Internal panel for hardware, support tickets and backup checks for a duty-free shop." },
        p: { es: "Una empresa sin área de TI no sabe qué equipos tiene, quién pidió qué ni si los respaldos realmente funcionan.",
             pt: "Uma empresa sem área de TI não sabe que equipamentos tem, quem pediu o quê nem se os backups realmente funcionam.",
             en: "A company with no IT department doesn't know what hardware it has, who asked for what, or whether backups actually work." },
        so: { es: "Un panel con inventario de activos, registro de pedidos de soporte y verificación periódica de respaldos, con usuarios dados de alta por el responsable de TI.",
              pt: "Um painel com inventário de ativos, registro de chamados de suporte e verificação periódica de backups, com usuários cadastrados pelo responsável de TI.",
              en: "A panel with an asset inventory, a support ticket log and periodic backup checks, with users added by the IT lead." },
        r: { es: "Documentación completa y maqueta funcional lista para presentar.",
             pt: "Documentação completa e protótipo funcional pronto para apresentar.",
             en: "Full documentation and a working mockup ready to present." },
        stack: ["HTML", "JavaScript", "ERS", "QA"]
      },
      {
        id: "utu", cats: ["dev"], status: "prod",
        t: { es: "Preinscripciones 2027 · UTU Tranqueras", pt: "Pré-inscrições 2027 · UTU Tranqueras", en: "2027 pre-enrollment · UTU Tranqueras" },
        s: { es: "Página pública de inscripciones a cursos con filtros por requisitos y contadores en vivo.",
             pt: "Página pública de inscrições em cursos com filtros por requisitos e contadores ao vivo.",
             en: "Public course enrollment page with requirement filters and live counters." },
        p: { es: "La escuela necesitaba medir el interés por cada curso de 2027 antes de abrir los grupos, sin planillas en papel.",
             pt: "A escola precisava medir o interesse por cada curso de 2027 antes de abrir as turmas, sem planilhas em papel.",
             en: "The school needed to gauge interest in each 2027 course before opening groups, without paper forms." },
        so: { es: "Sitio estático en GitHub Pages que habilita solo los cursos que la persona puede hacer según su edad y estudios, y guarda cada inscripción en Google Sheets mediante Apps Script.",
              pt: "Site estático no GitHub Pages que habilita só os cursos que a pessoa pode fazer conforme idade e escolaridade, e grava cada inscrição no Google Sheets via Apps Script.",
              en: "A static GitHub Pages site that only enables the courses a person qualifies for by age and schooling, and stores each sign-up in Google Sheets through Apps Script." },
        r: { es: "En producción, usado por la comunidad de Tranqueras, con costo de alojamiento cero.",
             pt: "Em produção, usado pela comunidade de Tranqueras, com custo zero de hospedagem.",
             en: "Live, used by the Tranqueras community, with zero hosting cost." },
        stack: ["HTML", "CSS", "JavaScript", "Google Apps Script", "GitHub Pages"],
        live: "https://utu-tranqueras.github.io/inscripciones-2027/",
        repo: "https://github.com/utu-tranqueras/inscripciones-2027"
      },
      {
        id: "hardened", cats: ["servers", "sec"], status: "prod", featured: true,
        t: { es: "Servidor Linux endurecido con app en Docker", pt: "Servidor Linux reforçado com app em Docker", en: "Hardened Linux server with a Docker app" },
        s: { es: "Ubuntu Server asegurado de punta a punta, con una aplicación Flask en un contenedor sin privilegios.",
             pt: "Ubuntu Server protegido de ponta a ponta, com uma aplicação Flask em contêiner sem privilégios.",
             en: "Ubuntu Server secured end to end, running a Flask app in an unprivileged container." },
        p: { es: "Un servidor recién instalado y expuesto a internet recibe intentos de acceso en cuestión de minutos.",
             pt: "Um servidor recém-instalado e exposto à internet recebe tentativas de acesso em minutos.",
             en: "A freshly installed internet-facing server gets login attempts within minutes." },
        so: { es: "SSH solo con llaves, firewall con lo mínimo, Fail2Ban, políticas PAM, ajustes del kernel y la aplicación empaquetada en Docker como usuario sin privilegios, gestionada con systemd.",
              pt: "SSH só com chaves, firewall mínimo, Fail2Ban, políticas PAM, ajustes de kernel e a aplicação empacotada em Docker como usuário sem privilégios, gerenciada pelo systemd.",
              en: "Key-only SSH, a minimal firewall, Fail2Ban, PAM policies, kernel tuning, and the app packaged in Docker as an unprivileged user, managed by systemd." },
        r: { es: "Cada comando verificado sobre un servidor real y documentado paso a paso.",
             pt: "Cada comando verificado em um servidor real e documentado passo a passo.",
             en: "Every command verified on a real server and documented step by step." },
        stack: ["Ubuntu Server", "SSH", "UFW", "Fail2Ban", "Docker", "systemd", "Flask"],
        repo: GH + "/maderera-hardened-server-lab"
      },
      {
        id: "live-ir", cats: ["sec", "servers"], status: "lab", featured: true,
        t: { es: "Respuesta a incidentes en un servidor comprometido", pt: "Resposta a incidentes em um servidor comprometido", en: "Incident response on a compromised server" },
        s: { es: "Lo que parecía un ataque externo era un compromiso interno con evidencia plantada.",
             pt: "O que parecia um ataque externo era um comprometimento interno com evidências plantadas.",
             en: "What looked like an outside attack was an inside job with planted evidence." },
        p: { es: "Un servidor Linux en producción con señales de intrusión, que no se podía apagar para analizar.",
             pt: "Um servidor Linux em produção com sinais de invasão, que não podia ser desligado para análise.",
             en: "A production Linux server showing signs of intrusion that couldn't be shut down for analysis." },
        so: { es: "Investigación en caliente cruzando auth.log, sesiones sudo y metadatos de archivos. Contención, erradicación y recuperación bajo SANS PICERL y NIST SP 800-61 Rev. 3, preservando cada evidencia con SHA-256 antes de tocarla.",
              pt: "Investigação ao vivo cruzando auth.log, sessões sudo e metadados de arquivos. Contenção, erradicação e recuperação segundo SANS PICERL e NIST SP 800-61 Rev. 3, preservando cada evidência com SHA-256 antes de mexer.",
              en: "Live investigation cross-checking auth.log, sudo sessions and file metadata. Containment, eradication and recovery under SANS PICERL and NIST SP 800-61 Rev. 3, preserving each piece of evidence with SHA-256 first." },
        r: { es: "Se ubicó el montaje en una ventana ciega de 99 minutos, con persistencia por cron y exfiltración de credenciales cada 15 minutos.",
             pt: "A montagem foi localizada numa janela cega de 99 minutos, com persistência via cron e exfiltração de credenciais a cada 15 minutos.",
             en: "The setup was traced to a 99-minute blind window, with cron persistence and credential exfiltration every 15 minutes." },
        stack: ["Linux", "auditd", "sudoreplay", "UFW", "SHA-256", "NIST SP 800-61"],
        repo: GH + "/live-ir-false-flag-lab"
      },
      {
        id: "wazuh", cats: ["sec", "servers"], status: "lab",
        t: { es: "Wazuh como SIEM con correlación multi-fuente", pt: "Wazuh como SIEM com correlação multifonte", en: "Wazuh SIEM with multi-source correlation" },
        s: { es: "Eventos del sistema, de autenticación y de una web WordPress correlacionados en un solo lugar.",
             pt: "Eventos do sistema, de autenticação e de um site WordPress correlacionados em um só lugar.",
             en: "System, authentication and WordPress events correlated in one place." },
        p: { es: "Los ataques reales dejan rastros dispersos en varios registros que, mirados por separado, no dicen nada.",
             pt: "Ataques reais deixam rastros espalhados em vários registros que, vistos separadamente, não dizem nada.",
             en: "Real attacks leave traces scattered across logs that mean nothing when read one by one." },
        so: { es: "Agente Wazuh en un endpoint Debian con PAM, sudo, integridad de archivos y registros de Apache y WordPress, con reglas propias mapeadas a MITRE ATT&CK.",
              pt: "Agente Wazuh em um endpoint Debian com PAM, sudo, integridade de arquivos e registros de Apache e WordPress, com regras próprias mapeadas ao MITRE ATT&CK.",
              en: "A Wazuh agent on a Debian endpoint with PAM, sudo, file integrity, Apache and WordPress logs, plus custom rules mapped to MITRE ATT&CK." },
        r: { es: "Tres escenarios de ataque simulados, detectados y documentados.",
             pt: "Três cenários de ataque simulados, detectados e documentados.",
             en: "Three simulated attack scenarios, detected and documented." },
        stack: ["Wazuh", "Debian", "Apache", "WordPress", "MITRE ATT&CK"],
        repo: GH + "/wazuh-siem-multi-source-correlation"
      },
      {
        id: "nsm", cats: ["servers", "sec", "net"], status: "lab",
        t: { es: "Estación de monitoreo de red", pt: "Estação de monitoramento de rede", en: "Network monitoring station" },
        s: { es: "Suricata, Zeek y Velociraptor funcionando juntos sobre un mismo equipo Debian.",
             pt: "Suricata, Zeek e Velociraptor funcionando juntos em um mesmo equipamento Debian.",
             en: "Suricata, Zeek and Velociraptor working together on one Debian machine." },
        p: { es: "Sin visibilidad del tráfico, un equipo infectado puede pasar meses comunicándose con el exterior sin que nadie lo note.",
             pt: "Sem visibilidade do tráfego, uma máquina infectada pode passar meses se comunicando com o exterior sem ninguém perceber.",
             en: "Without traffic visibility, an infected machine can talk to the outside for months unnoticed." },
        so: { es: "Suricata como detector de intrusiones, Zeek para registrar cada conexión y Velociraptor para investigar los equipos, con alertas y registro centralizado.",
              pt: "Suricata como detector de intrusões, Zeek para registrar cada conexão e Velociraptor para investigar as máquinas, com alertas e registro centralizado.",
              en: "Suricata for intrusion detection, Zeek to log every connection and Velociraptor to investigate endpoints, with alerts and central logging." },
        r: { es: "Visibilidad completa de red y equipos, documentada como guía reproducible.",
             pt: "Visibilidade completa de rede e máquinas, documentada como guia reproduzível.",
             en: "Full network and endpoint visibility, written up as a reproducible guide." },
        stack: ["Suricata", "Zeek", "Velociraptor", "Debian"],
        repo: GH
      },
      {
        id: "triage", cats: ["sec", "auto"], status: "tool",
        t: { es: "Triage de alertas con IA local", pt: "Triagem de alertas com IA local", en: "Local AI alert triage" },
        s: { es: "Un modelo de lenguaje que clasifica las alertas del SIEM antes de que lleguen a una persona.",
             pt: "Um modelo de linguagem que classifica os alertas do SIEM antes que cheguem a uma pessoa.",
             en: "A language model that sorts SIEM alerts before they reach a person." },
        p: { es: "Un SIEM genera tantas alertas que las importantes se pierden entre el ruido.",
             pt: "Um SIEM gera tantos alertas que os importantes se perdem no ruído.",
             en: "A SIEM raises so many alerts that the important ones drown in noise." },
        so: { es: "Integración de la respuesta activa de Wazuh con un modelo ejecutado con Ollama en la propia infraestructura, mediante un script en Python que clasifica y da contexto a cada alerta.",
              pt: "Integração da resposta ativa do Wazuh com um modelo rodando no Ollama na própria infraestrutura, por meio de um script em Python que classifica e contextualiza cada alerta.",
              en: "Wazuh active response wired to a model running on Ollama in-house, through a Python script that classifies and adds context to each alert." },
        r: { es: "Todo el procesamiento ocurre dentro de la empresa, sin enviar datos a servicios externos.",
             pt: "Todo o processamento ocorre dentro da empresa, sem enviar dados a serviços externos.",
             en: "All processing stays in-house, with no data sent to outside services." },
        stack: ["Python", "Ollama", "Wazuh"],
        repo: GH
      },
      {
        id: "fwaudit", cats: ["sec", "dev"], status: "tool",
        t: { es: "FirewallAuditor", pt: "FirewallAuditor", en: "FirewallAuditor" },
        s: { es: "Audita reglas de iptables y UFW, les pone un puntaje de 0 a 100 y propone los comandos de corrección.",
             pt: "Audita regras de iptables e UFW, dá uma nota de 0 a 100 e propõe os comandos de correção.",
             en: "Audits iptables and UFW rules, scores them from 0 to 100 and proposes fix commands." },
        p: { es: "Con el tiempo los firewalls acumulan reglas permisivas, duplicadas o que se tapan entre sí.",
             pt: "Com o tempo os firewalls acumulam regras permissivas, duplicadas ou que se sobrepõem.",
             en: "Over time firewalls pile up permissive, duplicate or shadowed rules." },
        so: { es: "Herramienta en Python que detecta reglas permisivas, sombreadas y puertos peligrosos, y genera informes en JSON, CSV y HTML.",
              pt: "Ferramenta em Python que detecta regras permissivas, sombreadas e portas perigosas, e gera relatórios em JSON, CSV e HTML.",
              en: "A Python tool that flags permissive and shadowed rules and risky ports, with JSON, CSV and HTML reports." },
        r: { es: "Un diagnóstico de firewall en segundos, con la corrección exacta para cada hallazgo.",
             pt: "Um diagnóstico de firewall em segundos, com a correção exata para cada achado.",
             en: "A firewall assessment in seconds, with the exact fix for each finding." },
        stack: ["Python", "iptables", "UFW"],
        repo: GH + "/FirewallAuditor"
      },
      {
        id: "netcentinela", cats: ["sec", "net", "dev"], status: "tool",
        t: { es: "NetCentinela", pt: "NetCentinela", en: "NetCentinela" },
        s: { es: "Inventario activo de red que avisa cuando aparece un equipo o un servicio nuevo.",
             pt: "Inventário ativo de rede que avisa quando surge uma máquina ou um serviço novo.",
             en: "Active network inventory that flags new devices and services." },
        p: { es: "En la mayoría de las redes nadie sabe con exactitud qué hay conectado ni qué cambió desde ayer.",
             pt: "Na maioria das redes ninguém sabe exatamente o que está conectado nem o que mudou desde ontem.",
             en: "In most networks nobody knows exactly what's connected or what changed since yesterday." },
        so: { es: "Herramienta propia que orquesta nmap, scapy y nuclei, guarda una línea base y señala cada desviación. Desarrollada con pruebas escritas antes que el código.",
              pt: "Ferramenta própria que orquestra nmap, scapy e nuclei, guarda uma linha de base e aponta cada desvio. Desenvolvida com testes escritos antes do código.",
              en: "My own tool orchestrating nmap, scapy and nuclei, keeping a baseline and flagging every deviation. Built test-first." },
        r: { es: "Cambios en la red detectados automáticamente, con historial.",
             pt: "Mudanças na rede detectadas automaticamente, com histórico.",
             en: "Network changes detected automatically, with history." },
        stack: ["Python", "nmap", "scapy", "nuclei", "TDD"],
        repo: GH
      },
      {
        id: "dmz", cats: ["net", "sec"], status: "lab",
        t: { es: "DMZ sobre firewall Cisco", pt: "DMZ em firewall Cisco", en: "DMZ on a Cisco firewall" },
        s: { es: "Tres zonas de confianza para que un servidor comprometido no pueda saltar a la red interna.",
             pt: "Três zonas de confiança para que um servidor comprometido não consiga pular para a rede interna.",
             en: "Three trust zones so a compromised server can't jump into the internal network." },
        p: { es: "Si el servidor web y las computadoras de la oficina comparten red, comprometer uno es comprometer todo.",
             pt: "Se o servidor web e os computadores do escritório compartilham a rede, comprometer um é comprometer tudo.",
             en: "If the web server and office computers share a network, one compromise means total compromise." },
        so: { es: "Router ISR con NAT estático que publica solo HTTP y listas de control de acceso con filtrado de retorno por estado.",
              pt: "Roteador ISR com NAT estático que publica só HTTP e listas de controle de acesso com filtragem de retorno por estado.",
              en: "An ISR router with static NAT publishing only HTTP and stateful return-traffic ACLs." },
        r: { es: "Segmentación verificada con pruebas de pivoteo bloqueadas.",
             pt: "Segmentação verificada com testes de pivotamento bloqueados.",
             en: "Segmentation verified with blocked pivot attempts." },
        stack: ["Cisco IOS", "ACL", "NAT"],
        repo: GH + "/dmz-lab"
      },
      {
        id: "industrial", cats: ["net"], status: "lab",
        t: { es: "Red industrial para aserradero", pt: "Rede industrial para serraria", en: "Industrial network for a sawmill" },
        s: { es: "Diseño por fases con red de gestión y red de planta separadas.",
             pt: "Projeto por fases com rede de gestão e rede de planta separadas.",
             en: "Phased design with separate management and plant networks." },
        p: { es: "En una planta industrial, una falla de red administrativa no puede detener las máquinas.",
             pt: "Numa planta industrial, uma falha na rede administrativa não pode parar as máquinas.",
             en: "In an industrial plant, an office network failure must not stop the machines." },
        so: { es: "Segmentación entre gestión y planta, criterios de disponibilidad y control de acceso entre zonas, documentado por etapas.",
              pt: "Segmentação entre gestão e planta, critérios de disponibilidade e controle de acesso entre zonas, documentado por etapas.",
              en: "Segmentation between office and plant, availability criteria and inter-zone access control, documented in stages." },
        r: { es: "Un plan de red listo para implementarse en el sector forestal.",
             pt: "Um plano de rede pronto para implantar no setor florestal.",
             en: "A network plan ready to roll out in the forestry sector." },
        stack: ["VLAN", "Cisco IOS", "ACL"],
        repo: GH + "/cuchilla-negra-industrial-network"
      },
      {
        id: "bastion", cats: ["dev", "sec"], status: "lab",
        t: { es: "bastion-cv: web endurecida y atacada", pt: "bastion-cv: site reforçado e atacado", en: "bastion-cv: hardened and attacked site" },
        s: { es: "Una aplicación web asegurada al máximo razonable y atacada en vivo antes de publicarse.",
             pt: "Uma aplicação web protegida ao máximo razoável e atacada ao vivo antes de ser publicada.",
             en: "A web app hardened as far as reasonable and attacked live before going public." },
        p: { es: "La mayoría de los sitios salen a internet sin que nadie haya intentado romperlos.",
             pt: "A maioria dos sites vai para a internet sem que ninguém tenha tentado quebrá-los.",
             en: "Most sites go live without anyone trying to break them first." },
        so: { es: "Mapeo al OWASP Top 10, CSP nivel 3 sin unsafe-inline, anti-CSRF con HMAC-SHA256, protección anti-SSRF y contenedor sin root de solo lectura.",
              pt: "Mapeamento ao OWASP Top 10, CSP nível 3 sem unsafe-inline, anti-CSRF com HMAC-SHA256, proteção anti-SSRF e contêiner sem root somente leitura.",
              en: "OWASP Top 10 mapping, CSP Level 3 without unsafe-inline, HMAC-SHA256 anti-CSRF, SSRF protection and a read-only rootless container." },
        r: { es: "Informe completo de autoauditoría publicado junto al código.",
             pt: "Relatório completo de autoauditoria publicado junto com o código.",
             en: "A full self-audit report published alongside the code." },
        stack: ["JavaScript", "Docker", "OWASP", "CSP"],
        repo: GH + "/bastion-cv"
      },
      {
        id: "mail-classifier", cats: ["auto"], status: "wip",
        t: { es: "Clasificador inteligente de correos", pt: "Classificador inteligente de e-mails", en: "Smart email classifier" },
        s: { es: "Ordena la bandeja de entrada por tipo, avisa lo urgente y deja borradores de respuesta.",
             pt: "Organiza a caixa de entrada por tipo, avisa o urgente e deixa rascunhos de resposta.",
             en: "Sorts the inbox by type, flags urgent mail and drafts replies." },
        p: { es: "Clientes, proveedores, facturas y reclamos llegan mezclados a la misma casilla y lo urgente se pierde.",
             pt: "Clientes, fornecedores, faturas e reclamações chegam misturados na mesma caixa e o urgente se perde.",
             en: "Customers, suppliers, invoices and complaints land in one inbox and urgent mail gets lost." },
        so: { es: "Flujo de n8n que clasifica cada correo con IA, le pone la etiqueta correcta, lo registra en una planilla, avisa por Telegram los reclamos y deja un borrador en portugués para clientes.",
              pt: "Fluxo n8n que classifica cada e-mail com IA, aplica a etiqueta certa, registra numa planilha, avisa as reclamações pelo Telegram e deixa um rascunho em português para clientes.",
              en: "An n8n flow that classifies each email with AI, labels it, logs it to a sheet, sends complaints to Telegram and drafts a Portuguese reply for customers." },
        r: { es: "En construcción como segunda demo para comercios.",
             pt: "Em construção como segunda demonstração para comércios.",
             en: "Being built as a second demo for retailers." },
        stack: ["n8n", "Gmail", "LLM", "Google Sheets", "Telegram"]
      }
    ],

    timeline: [
      { y: "2022–2025",
        t: { es: "Tecnólogo en Análisis y Desarrollo de Sistemas", pt: "Tecnólogo em Análise e Desenvolvimento de Sistemas", en: "Degree in Systems Analysis and Development" },
        o: { es: "UTEC y DGETP-UTU, programa binacional con IFSul. Promedio 4.25 de 5.", pt: "UTEC e DGETP-UTU, programa binacional com o IFSul. Média 4,25 de 5.", en: "UTEC and DGETP-UTU, binational program with IFSul. GPA 4.25 out of 5." } },
      { y: "2023",
        t: { es: "NASA International Space Apps Challenge", pt: "NASA International Space Apps Challenge", en: "NASA International Space Apps Challenge" },
        o: { es: "Reconocimiento Galactic Problem Solver.", pt: "Reconhecimento Galactic Problem Solver.", en: "Galactic Problem Solver recognition." } },
      { y: "2023–2024",
        t: { es: "Pasantía en integración de sistemas", pt: "Estágio em integração de sistemas", en: "Systems integration internship" },
        o: { es: "Perceptiva, Brasil, remoto. APIs con Axway, ETL en Python y sincronización de stock entre SAP y un SaaS.", pt: "Perceptiva, Brasil, remoto. APIs com Axway, ETL em Python e sincronização de estoque entre SAP e um SaaS.", en: "Perceptiva, Brazil, remote. Axway APIs, Python ETL and SAP-to-SaaS stock sync." } },
      { y: "2024",
        t: { es: "Profesor de Informática y Sistemas", pt: "Professor de Informática e Sistemas", en: "IT and Systems teacher" },
        o: { es: "DGETP-UTU, Rivera y Tranqueras. Hasta hoy.", pt: "DGETP-UTU, Rivera e Tranqueras. Até hoje.", en: "DGETP-UTU, Rivera and Tranqueras. Ongoing." } },
      { y: "2024",
        t: { es: "Ponente en CINTIA 2024", pt: "Palestrante na CINTIA 2024", en: "Speaker at CINTIA 2024" },
        o: { es: "III Conferencia Internacional en Aplicaciones de Inteligencia Artificial, UTEC.", pt: "III Conferência Internacional em Aplicações de Inteligência Artificial, UTEC.", en: "3rd International Conference on AI Applications, UTEC." } },
      { y: "2025",
        t: { es: "Técnico en Testing de Software", pt: "Técnico em Testes de Software", en: "Software Testing Technician" },
        o: { es: "Ceibal, Jóvenes a Programar, con CUTI y BID Lab. Nivel avanzado, 92 %.", pt: "Ceibal, Jóvenes a Programar, com CUTI e BID Lab. Nível avançado, 92 %.", en: "Ceibal, Jóvenes a Programar, with CUTI and IDB Lab. Advanced level, 92%." } },
      { y: "2026",
        t: { es: "Cybersecurity Specialist, 320 horas", pt: "Cybersecurity Specialist, 320 horas", en: "Cybersecurity Specialist, 320 hours" },
        o: { es: "4Geeks Academy y UTEC, orientación Blue Team y SOC.", pt: "4Geeks Academy e UTEC, foco em Blue Team e SOC.", en: "4Geeks Academy and UTEC, Blue Team and SOC track." } },
      { y: "2026",
        t: { es: "Cyber Verification Program de Anthropic", pt: "Cyber Verification Program da Anthropic", en: "Anthropic Cyber Verification Program" },
        o: { es: "Admitido en el programa de acceso verificado para trabajo de ciberseguridad.", pt: "Admitido no programa de acesso verificado para trabalho de cibersegurança.", en: "Admitted to the verified-access program for cybersecurity work." } }
    ],

    certs: [
      {
        g: { es: "Ciberseguridad", pt: "Cibersegurança", en: "Cybersecurity" },
        items: [
          ["Cybersecurity Specialist · 320 h", "4Geeks Academy · UTEC"],
          ["IBM Ethical Hacking with Open Source Tools", "IBM · Coursera"],
          ["Ciclo Fundamentos Cyber · 135 h", "UTEC · AGESIC"],
          ["Security Principles", "ISC2"],
          ["Incident Response, BC and DR Concepts", "ISC2"],
          ["Foundations of Cybersecurity", "Google"],
          ["Bootcamp Riachuelo · Cibersegurança", "Digital Innovation One"]
        ]
      },
      {
        g: { es: "Testing y calidad", pt: "Testes e qualidade", en: "Testing and quality" },
        items: [
          ["Técnico en Testing · Nivel 1 · 92 %", "Ceibal · CUTI · BID Lab"]
        ]
      },
      {
        g: { es: "Desarrollo y datos", pt: "Desenvolvimento e dados", en: "Development and data" },
        items: [
          ["Bootcamp Orange Tech + BackEnd · 87 h", "DIO · Inter"],
          ["Programación con Java Standard · 40 h", "Conecta Empleo · MEC"],
          ["Data Analysis with Python", "IBM"],
          ["Python for Data Science, AI & Development", "IBM"],
          ["API REST con Spring Web y Swagger", "Digital Innovation One"],
          ["SQL, MySQL y MongoDB", "Universidad de Palermo · DIO · Coursera"]
        ]
      }
    ],

    /* Preguntas del paso 2 según el servicio elegido.
       type: radio (una opción) | check (varias) | select */
    formDetails: {
      infra: [
        { id: "situacion", type: "radio", req: true,
          q: { es: "¿Cuál es tu situación?", pt: "Qual é a sua situação?", en: "What's your situation?" },
          o: [
            ["nuevo", { es: "No tengo servidor y necesito uno", pt: "Não tenho servidor e preciso de um", en: "I don't have a server and need one" }],
            ["mejorar", { es: "Tengo uno y quiero mejorarlo o asegurarlo", pt: "Tenho um e quero melhorar ou proteger", en: "I have one and want to improve or secure it" }],
            ["problema", { es: "Mi servidor tiene un problema ahora", pt: "Meu servidor está com problema agora", en: "My server has a problem right now" }]
          ] },
        { id: "donde", type: "radio", req: true,
          q: { es: "¿Dónde va a estar?", pt: "Onde ele vai ficar?", en: "Where will it run?" },
          o: [
            ["local", { es: "En un equipo de la empresa", pt: "Em um equipamento da empresa", en: "On company hardware" }],
            ["nube", { es: "En la nube (AWS, Azure, Google, VPS)", pt: "Na nuvem (AWS, Azure, Google, VPS)", en: "In the cloud (AWS, Azure, Google, VPS)" }],
            ["nose", { es: "No sé, quiero que me recomiendes", pt: "Não sei, quero uma recomendação", en: "Not sure, I'd like a recommendation" }]
          ] },
        { id: "uso", type: "check", req: true,
          q: { es: "¿Qué va a correr en el servidor?", pt: "O que vai rodar no servidor?", en: "What will run on the server?" },
          o: [
            ["gestion", { es: "Sistema de gestión", pt: "Sistema de gestão", en: "Management system" }],
            ["web", { es: "Página o sistema web", pt: "Site ou sistema web", en: "Website or web app" }],
            ["archivos", { es: "Archivos compartidos", pt: "Arquivos compartilhados", en: "Shared files" }],
            ["bd", { es: "Base de datos", pt: "Banco de dados", en: "Database" }],
            ["camaras", { es: "Cámaras de seguridad", pt: "Câmeras de segurança", en: "Security cameras" }],
            ["otro", { es: "Otra cosa", pt: "Outra coisa", en: "Something else" }]
          ] },
        { id: "usuarios", type: "select", req: false,
          q: { es: "¿Cuántas personas lo van a usar?", pt: "Quantas pessoas vão usar?", en: "How many people will use it?" },
          o: [["1-5", "1–5"], ["6-20", "6–20"], ["21-50", "21–50"], ["50+", "50+"]] }
      ],
      dev: [
        { id: "plataforma", type: "check", req: true,
          q: { es: "¿Para qué plataforma?", pt: "Para qual plataforma?", en: "Which platform?" },
          o: [
            ["web", { es: "Web", pt: "Web", en: "Web" }],
            ["escritorio", { es: "Escritorio (Windows, Linux)", pt: "Desktop (Windows, Linux)", en: "Desktop (Windows, Linux)" }],
            ["android", { es: "Android", pt: "Android", en: "Android" }],
            ["iphone", { es: "iPhone", pt: "iPhone", en: "iPhone" }]
          ] },
        { id: "etapa", type: "radio", req: true,
          q: { es: "¿En qué etapa está?", pt: "Em que etapa está?", en: "What stage is it at?" },
          o: [
            ["idea", { es: "Solo tengo la idea", pt: "Só tenho a ideia", en: "Just an idea" }],
            ["diseno", { es: "Tengo un diseño o un ejemplo de referencia", pt: "Tenho um layout ou um exemplo de referência", en: "I have a design or a reference example" }],
            ["existe", { es: "Ya existe y hay que mejorarlo", pt: "Já existe e precisa melhorar", en: "It exists and needs improving" }]
          ] },
        { id: "funciones", type: "check", req: false,
          q: { es: "¿Qué tiene que hacer?", pt: "O que precisa fazer?", en: "What should it do?" },
          o: [
            ["login", { es: "Usuarios con contraseña", pt: "Usuários com senha", en: "User accounts" }],
            ["stock", { es: "Stock o inventario", pt: "Estoque ou inventário", en: "Stock or inventory" }],
            ["ventas", { es: "Ventas o facturación", pt: "Vendas ou faturamento", en: "Sales or invoicing" }],
            ["turnos", { es: "Turnos o reservas", pt: "Agendamentos ou reservas", en: "Bookings" }],
            ["reportes", { es: "Reportes", pt: "Relatórios", en: "Reports" }],
            ["pagos", { es: "Pagos en línea", pt: "Pagamentos online", en: "Online payments" }],
            ["integrar", { es: "Conectarse con otro sistema", pt: "Integrar com outro sistema", en: "Connect to another system" }]
          ] }
      ],
      support: [
        { id: "equipos", type: "select", req: true,
          q: { es: "¿Cuántos equipos tiene la empresa?", pt: "Quantos equipamentos a empresa tem?", en: "How many computers does the business have?" },
          o: [["1-5", "1–5"], ["6-15", "6–15"], ["16-40", "16–40"], ["40+", "40+"]] },
        { id: "modalidad", type: "radio", req: true,
          q: { es: "¿Qué tipo de soporte buscás?", pt: "Que tipo de suporte você procura?", en: "What kind of support?" },
          o: [
            ["puntual", { es: "Resolver un problema puntual", pt: "Resolver um problema pontual", en: "Fix a specific problem" }],
            ["mensual", { es: "Mantenimiento mensual", pt: "Manutenção mensal", en: "Monthly maintenance" }],
            ["relevamiento", { es: "Un relevamiento inicial para ordenar todo", pt: "Um levantamento inicial para organizar tudo", en: "An initial review to get things in order" }]
          ] },
        { id: "sistemas", type: "check", req: false,
          q: { es: "¿Qué hay que atender?", pt: "O que precisa de atenção?", en: "What needs looking after?" },
          o: [
            ["windows", { es: "Computadoras Windows", pt: "Computadores Windows", en: "Windows computers" }],
            ["linux", { es: "Equipos Linux", pt: "Máquinas Linux", en: "Linux machines" }],
            ["red", { es: "Red y wifi", pt: "Rede e Wi-Fi", en: "Network and Wi-Fi" }],
            ["pos", { es: "Impresoras y cajas (POS)", pt: "Impressoras e caixas (PDV)", en: "Printers and POS" }],
            ["correo", { es: "Correo y cuentas", pt: "E-mail e contas", en: "Email and accounts" }]
          ] }
      ],
      auto: [
        { id: "tarea", type: "check", req: true,
          q: { es: "¿Qué te gustaría automatizar?", pt: "O que você gostaria de automatizar?", en: "What would you like to automate?" },
          o: [
            ["consultas", { es: "Responder consultas de clientes", pt: "Responder dúvidas de clientes", en: "Answer customer questions" }],
            ["correos", { es: "Clasificar correos", pt: "Classificar e-mails", en: "Sort emails" }],
            ["reportes", { es: "Reportes automáticos", pt: "Relatórios automáticos", en: "Automatic reports" }],
            ["carga", { es: "Cargar datos en planillas", pt: "Lançar dados em planilhas", en: "Enter data into spreadsheets" }],
            ["avisos", { es: "Avisos y recordatorios", pt: "Avisos e lembretes", en: "Alerts and reminders" }],
            ["otra", { es: "Otra tarea", pt: "Outra tarefa", en: "Something else" }]
          ] },
        { id: "herramientas", type: "check", req: false,
          q: { es: "¿Qué herramientas usan hoy?", pt: "Quais ferramentas vocês usam hoje?", en: "Which tools do you use today?" },
          o: [
            ["whatsapp", { es: "WhatsApp", pt: "WhatsApp", en: "WhatsApp" }],
            ["telegram", { es: "Telegram", pt: "Telegram", en: "Telegram" }],
            ["correo", { es: "Gmail u Outlook", pt: "Gmail ou Outlook", en: "Gmail or Outlook" }],
            ["planillas", { es: "Google Sheets o Excel", pt: "Google Sheets ou Excel", en: "Google Sheets or Excel" }],
            ["sistema", { es: "Un sistema propio", pt: "Um sistema próprio", en: "An in-house system" }]
          ] },
        { id: "horas", type: "select", req: false,
          q: { es: "¿Cuántas horas por semana lleva hoy esa tarea?", pt: "Quantas horas por semana essa tarefa leva hoje?", en: "How many hours a week does it take today?" },
          o: [["<2", "< 2"], ["2-5", "2–5"], ["5-10", "5–10"], ["10+", "10+"]] }
      ],
      sec: [
        { id: "estado", type: "radio", req: true,
          q: { es: "¿Cuál es tu situación?", pt: "Qual é a sua situação?", en: "What's your situation?" },
          o: [
            ["incidente", { es: "Tengo un incidente ahora", pt: "Estou com um incidente agora", en: "I have an incident right now" }],
            ["sospecha", { es: "Sospecho que algo anda mal", pt: "Suspeito que algo está errado", en: "I suspect something is wrong" }],
            ["prevenir", { es: "Quiero prevenir", pt: "Quero prevenir", en: "I want to prevent problems" }]
          ] },
        { id: "proteger", type: "check", req: true,
          q: { es: "¿Qué querés proteger?", pt: "O que você quer proteger?", en: "What do you want to protect?" },
          o: [
            ["pcs", { es: "Computadoras", pt: "Computadores", en: "Computers" }],
            ["servidor", { es: "Servidor", pt: "Servidor", en: "Server" }],
            ["red", { es: "Red y wifi", pt: "Rede e Wi-Fi", en: "Network and Wi-Fi" }],
            ["correo", { es: "Correo", pt: "E-mail", en: "Email" }],
            ["web", { es: "Página web", pt: "Site", en: "Website" }],
            ["datos", { es: "Datos de clientes", pt: "Dados de clientes", en: "Customer data" }]
          ] }
      ],
      train: [
        { id: "tema", type: "check", req: true,
          q: { es: "¿Sobre qué tema?", pt: "Sobre qual tema?", en: "Which topic?" },
          o: [
            ["seguridad", { es: "Seguridad para usuarios", pt: "Segurança para usuários", en: "Security awareness" }],
            ["ia", { es: "IA en el trabajo", pt: "IA no trabalho", en: "AI at work" }],
            ["planillas", { es: "Planillas y herramientas digitales", pt: "Planilhas e ferramentas digitais", en: "Spreadsheets and digital tools" }],
            ["otro", { es: "Otro tema", pt: "Outro tema", en: "Another topic" }]
          ] },
        { id: "personas", type: "select", req: true,
          q: { es: "¿Cuántas personas participarían?", pt: "Quantas pessoas participariam?", en: "How many people would attend?" },
          o: [["1-5", "1–5"], ["6-15", "6–15"], ["16-30", "16–30"], ["30+", "30+"]] },
        { id: "formato", type: "radio", req: true,
          q: { es: "¿Formato?", pt: "Formato?", en: "Format?" },
          o: [
            ["presencial", { es: "Presencial", pt: "Presencial", en: "In person" }],
            ["virtual", { es: "Virtual", pt: "Online", en: "Online" }],
            ["indistinto", { es: "Me da igual", pt: "Tanto faz", en: "Either" }]
          ] }
      ],
      other: []
    },

    descPlaceholder: {
      infra: { es: "Ej.: tenemos el sistema de facturación en una PC vieja y queremos pasarlo a un servidor con respaldo.", pt: "Ex.: temos o sistema de faturamento num PC antigo e queremos passar para um servidor com backup.", en: "E.g. our invoicing system runs on an old PC and we want to move it to a server with backups." },
      dev: { es: "Ej.: necesitamos una app para que los clientes hagan pedidos y nosotros los veamos en una pantalla.", pt: "Ex.: precisamos de um app para os clientes fazerem pedidos e nós vermos numa tela.", en: "E.g. we need an app where customers place orders and we see them on a screen." },
      support: { es: "Ej.: somos 8 personas, la red se cae seguido y nadie sabe qué equipos tenemos.", pt: "Ex.: somos 8 pessoas, a rede cai com frequência e ninguém sabe que equipamentos temos.", en: "E.g. we're 8 people, the network keeps dropping and nobody knows what hardware we have." },
      auto: { es: "Ej.: todos los días respondemos a mano las mismas preguntas de precio por WhatsApp.", pt: "Ex.: todo dia respondemos à mão as mesmas perguntas de preço pelo WhatsApp.", en: "E.g. every day we answer the same price questions on WhatsApp by hand." },
      sec: { es: "Ej.: un empleado recibió un correo raro y ahora la computadora anda lenta.", pt: "Ex.: um funcionário recebeu um e-mail estranho e agora o computador está lento.", en: "E.g. an employee got a strange email and now the computer is slow." },
      train: { es: "Ej.: queremos que el equipo de ventas aprenda a detectar estafas por correo.", pt: "Ex.: queremos que a equipe de vendas aprenda a identificar golpes por e-mail.", en: "E.g. we want the sales team to learn to spot email scams." },
      other: { es: "Contame qué necesitás y vemos cómo resolverlo.", pt: "Conte o que você precisa e vemos como resolver.", en: "Tell me what you need and we'll work out how to solve it." }
    },

    otherService: { es: "Otra cosa", pt: "Outra coisa", en: "Something else" }
  };
})();
