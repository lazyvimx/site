#!/usr/bin/env bash
# Выкладка на самом сервере: подтянуть main и пересобрать контейнер.
# Её вызывают GitHub Actions на каждый пуш в main и при ручном запуске workflow.
# Для ключа из Actions это единственная разрешённая команда (command= в authorized_keys).
set -euo pipefail

# Тело в блоке: bash дочитает его целиком до того, как git pull подменит этот файл.
{
	cd /srv/lazyvimx-site

	# Два запуска подряд не должны собирать compose одновременно: второй ждёт первого.
	exec 9>/tmp/lazyvimx-site-deploy.lock
	flock 9

	git pull --ff-only --quiet
	git log -1 --oneline
	# Сайт пересобирают и после правки доков в lazyvimx, когда здесь ничего не менялось.
	DOCS_REV=$(git ls-remote https://github.com/lazyvimx/nvim.git refs/heads/develop | cut -f1)
	export DOCS_REV
	echo "docs: ${DOCS_REV}"
	docker compose -f deploy/docker-compose.yml up -d --build --quiet-pull
	docker image prune -f >/dev/null
	exit
}
