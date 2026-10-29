package com.ecothugom.catalog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface PriceRuleRepository extends JpaRepository<PriceRule, Long> {
    @Query("select coalesce(max(p.versionNumber),0) from PriceRule p where p.material.id=:materialId")
    int latestVersion(@Param("materialId") int materialId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PriceRule p where p.id=:id")
    Optional<PriceRule> findForUpdate(@Param("id") long id);

    @Query(value="""
        select p from PriceRule p join fetch p.material m join fetch m.category
        where (:materialId is null or m.id=:materialId)
          and (:status is null or p.approvalStatus=:status)
        """, countQuery="""
        select count(p) from PriceRule p where (:materialId is null or p.material.id=:materialId)
          and (:status is null or p.approvalStatus=:status)
        """)
    Page<PriceRule> findForAdmin(@Param("materialId") Integer materialId, @Param("status") String status, Pageable page);

    @Query("""
        select p from PriceRule p
        where p.material.id in :materialIds
          and p.approvalStatus = 'APPROVED'
          and p.validFrom <= :asOf
          and (p.validTo is null or p.validTo > :asOf)
          and not exists (
              select newer.id from PriceRule newer
              where newer.material.id = p.material.id
                and newer.approvalStatus = 'APPROVED'
                and newer.validFrom <= :asOf
                and (newer.validTo is null or newer.validTo > :asOf)
                and newer.versionNumber > p.versionNumber
          )
        """)
    List<PriceRule> findCurrent(@Param("materialIds") List<Integer> materialIds,
                                @Param("asOf") LocalDateTime asOf);
}
